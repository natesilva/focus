## Context

`focus` runs the container as a non-root user whose UID matches the host user (a Phase 1 decision, to keep bind-mount ownership clean on Linux). Persistent tool state is bind-mounted under the canonical home `/home/focususer` (e.g. `~/.claude`). The entrypoint creates the user at container start via `useradd -u $FOCUS_UID -m`.

Two latent problems surfaced during the post–Phase 5 bugfix cycle:

1. Container runtimes pre-create the mount-point parent (`/home/focususer`) as root before the container starts, in order to host the bind-mounted volume subdir. `useradd -m` then finds the home already present and does not chown it, leaving it owned by root (mode 0755). The non-root user can traverse and read its home but cannot create files in it. Tools that write dotfiles directly in `$HOME` — notably Claude Code writing `~/.claude.json` — block instead of erroring. This reproduced identically under both the Docker backend and Apple `container`; running as root masked it (root bypasses the permission check via `DAC_OVERRIDE`).

2. When the host UID collides with a user already present in the base image (e.g. `ubuntu:24.04` ships `ubuntu` at UID 1000 with home `/home/ubuntu`), the running user's home is not `/home/focususer`, so volumes mounted at the canonical paths are not visible at the user's `~`.

## Goals / Non-Goals

**Goals:**
- The non-root container user can write its own home directory.
- Volumes remain reachable at the running user's `~` regardless of which user the host UID maps to in the base image.
- Preserve the existing model: host bind mounts, host-browsable XDG volumes, non-root user. No move to Docker named volumes.

**Non-Goals:**
- Changing the volume catalog, the canonical mount paths, the runtime adapter interface, or the config schema.
- Deriving the container home dynamically in TypeScript (the previous comment speculated this for Phase 6); the entrypoint handles it at runtime instead.
- Apple Containers backend work (Phase 6).

## Decisions

- **Fix ownership in the entrypoint, not in the volume manager.** The home directory is created by the runtime at container start, so the TypeScript volume manager cannot influence its ownership; the entrypoint runs as root before dropping privileges and is the correct place. It chowns `$HOME` to `$FOCUS_UID`.
  - Alternative considered: run the container as root (matches the older `ai-container` tool). Rejected — non-root is a core design decision and root only masks the bug.

- **Non-recursive chown.** Only the home directory itself needs to change owner so the user can create entries in it. Bind-mounted subdirs (`~/.claude`, `~/.ssh`) are already owned by the host UID via the volume manager's `chown` of the host directory; a recursive chown would needlessly walk the (potentially macOS-backed) shared volume.

- **Symlink volumes into a divergent home.** When the resolved home differs from `/home/focususer`, the entrypoint symlinks each volume dotdir from `/home/focususer` into the actual home, skipping any pre-existing target. This keeps the canonical mount paths fixed while making them reachable at `~`.

- **`claude-code` / `rust` install methods** are corrected as part of the same cycle but are implementation details within the existing `tool-profile-catalog` contract, so they carry no spec delta.

## Risks / Trade-offs

- **Recursive vs non-recursive chown** → Non-recursive is intentional; if a future tool needs ownership of nested non-mounted home content, it creates that content itself as the (now home-owning) user, so no recursion is required.
- **Symlink path is exercised mainly on Linux (UID 1000 → `ubuntu`)** → On the primary macOS case the host UID is typically 501, so a fresh `focususer` is created and the symlink branch is skipped; the branch is defensive for the collision case and is a no-op otherwise.
- **chown failure under an unexpectedly read-only home** → Guarded by an existence check; under `set -e` a genuine failure surfaces loudly rather than silently leaving an unwritable home.
