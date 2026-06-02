## Context

Today both runtime adapters hard-code `-v ${cwd}:/focus` in `start()` and `--workdir /focus` in `exec()`. The entrypoint does `cd /focus`. This means every project occupies the same in-container path, git worktrees created by tools like Claude Code (`git worktree add ../feature-x`) land outside the container namespace, and per-project harness settings (Claude Code stores these keyed by working directory path) accumulate under the same key for every project.

The fix is a two-layer mount:

```
-v focus-ws-<hash8>:/focus          # named volume — persistent namespace for siblings
-v ~/dev/api-server:/focus/api-server  # project bind-mount on top
```

Linux VFS (and the VM kernel inside Apple Containers) handles nested mounts correctly. `/focus/api-server` is a real directory, not a symlink, so `pwd` and git agree on the path. Worktrees created at `/focus/api-server-feature-x` live in the named volume and survive container restarts.

## Goals / Non-Goals

**Goals:**
- Project mounts at `/focus/<dirname>` so siblings have a real home under `/focus`
- Per-project named volume provides persistent worktree storage across `focus stop`/`focus start`
- Each project gets a distinct in-container path for harness isolation
- `git worktree prune` runs automatically on container start to clear stale metadata
- Future `focus prune` can clean up workspace volumes by name convention

**Non-Goals:**
- `focus prune` implementation (deferred; volume naming convention supports it when ready)
- Volume scope/sharing system (separate future feature)
- Any change to how tool profile volumes (`.claude`, `.ssh`, etc.) work

## Decisions

### Named volume over host directory for the `/focus` namespace

**Decision:** Use a Docker/Apple Containers named volume (`focus-ws-<hash8>`) at `/focus`, not a bind-mount of a host XDG directory.

**Rationale:** Worktrees contain build artifacts and temporary files that should not be visible on the host. Named volumes are opaque to the Mac filesystem by design. The project directory itself (`~/dev/<dirname>`) remains a bind-mount and stays fully visible and editable from the host.

**Alternative considered:** Bind-mount `~/.local/share/focus/workspaces/<hash>/` at `/focus`. Rejected because worktree files would be visible in the Mac filesystem (usually unwanted) and it adds host-side directory management (mkdir, chown) for the workspace root.

### Volume naming: `focus-ws-<hash8>` mirrors container name `focus-<hash8>`

**Decision:** The workspace volume for a project is named `focus-ws-<hash8>` where `hash8` is the same 8-character sha256 prefix of the resolved cwd path used in `containerName()`.

**Rationale:** Enables paired cleanup in a future `focus prune` without requiring volume labels. Given container `focus-abc12345`, its workspace volume is always `focus-ws-abc12345`. No label lookup or extra metadata needed.

### `exec()` gains an optional `workdir` parameter

**Decision:** Add `workdir?: string` as a last optional parameter to `RuntimeAdapter.exec()`. `attachContainer()` receives `cwd` and passes `/focus/${basename(cwd)}`.

**Rationale:** The exec codepath doesn't currently know the project dirname. The cleanest fix is an explicit parameter. Alternatives considered:
- Read `focus.cwd` label at exec time (adds a round-trip inspect call)
- Pass workdir through the env map (hacky, leaks an implementation detail)

### Config hash includes layout version

**Decision:** Add `layoutVersion: 2` to the data object serialized in `configHash()`.

**Rationale:** Existing containers are mounted at `/focus`. The new layout (`/focus/<dirname>`) is incompatible. Without a version in the hash, the new code would see existing containers as "current" and attach to them with the wrong workdir. Adding the version constant causes all existing containers to appear stale and triggers a rebuild. Acceptable for a pre-beta project.

### `git worktree prune` in the entrypoint

**Decision:** Add `git -C "/focus/$FOCUS_PROJECT" worktree prune 2>/dev/null || true` to `entrypoint.sh` after the `cd`.

**Rationale:** Stale worktree metadata in `.git/worktrees/` accumulates when worktrees are deleted from inside the container or when the container is rebuilt. Pruning on each start is cheap, idempotent, and handles the common case silently. The `|| true` ensures the container starts even when the project is not a git repo.

## Risks / Trade-offs

**Named volume ext4 corruption on Apple Containers (heavy I/O, long sessions)** → A known upstream issue. Mitigation: worktrees are source files and metadata, not heavy-I/O workloads. Risk is low in practice. Document under known limitations.

**Nested mounts on Apple Containers untested in this specific combination** → The named volume is a virtio-blk ext4 device; the project bind-mount is a virtiofs share. Both are mounted inside the VM kernel, which handles nested mounts correctly. Functionally verified for Docker; Apple Containers follows the same Linux VFS rules inside the VM.

**`focus-ws-*` volumes accumulate with no auto-cleanup** → Accepted debt. The naming convention makes future `focus prune` straightforward. Document that workspace volumes are persistent and must be manually pruned until that command exists.

**dirname collision (`~/work/app` and `~/personal/app` both become `/focus/app`)** → Not a problem. Each project has its own container (different hash) and its own named volume (`focus-ws-<hash>`). The `/focus/app` path appears in two completely independent volumes; they never interact.

## Migration Plan

No migration script needed. The layout version bump in `configHash()` causes each project's container to appear stale on next `focus shell`. The user sees the existing "Config changed, rebuilding container..." message and the container is replaced with the new mount layout.

Existing named volumes from the old scheme: none (old scheme used no named volumes). No cleanup required.

## Open Questions

- Apple Containers nested mounts: works in theory (Linux VFS in VM), but should be verified manually before shipping this feature.
