## Why

The Docker-based implementation (post Phase 5) shipped with a latent contract gap: the non-root container user was created but did not own its home directory, so tools that write dotfiles directly in `$HOME` (e.g. Claude Code writing `~/.claude.json`) blocked indefinitely. This surfaced as a hard-to-diagnose hang. The underlying guarantees — that the container user can write its own home, and that persistent volumes are reachable at the running user's home even when the image's UID mapping diverges — were never specified, so nothing protected against regression.

## What Changes

- The container entrypoint takes ownership of the user's home directory (`chown $FOCUS_UID $HOME`, non-recursive) so the non-root user can create dotfiles in `$HOME`. The runtime pre-creates the home directory as root in order to host bind-mounted volume subdirs (e.g. `~/.claude`), which means `useradd -m` finds it already present and never chowns it.
- The entrypoint symlinks the persistent volume dotdirs from `/home/focususer` into the running user's actual home when the host UID maps to a pre-existing image user with a different home (e.g. `ubuntu:24.04` ships `ubuntu` at UID 1000 with home `/home/ubuntu`), so volumes remain reachable at `~/.<tool>`.
- (Implementation only, no requirement change) The `claude-code` profile installs Node 24 and `npm install -g @anthropic-ai/claude-code` (system-wide, on `PATH`) instead of the per-user `curl | bash` installer; the `rust` profile installs apt `rustc`/`cargo` instead of root-only `rustup` and drops the non-existent `rust-cargo`/`rust-rustup` volume slots.

## Capabilities

### New Capabilities
<!-- None: both behaviors extend existing capabilities. -->

### Modified Capabilities
- `container-launch`: add a requirement that the non-root container user owns and can write its home directory.
- `volume-manager`: add a requirement that mounted volumes are reachable at the running user's home even when that home differs from `/home/focususer`.

## Impact

- `src/entrypoint.sh`: home-directory `chown`; volume-dotdir symlinking for divergent homes.
- `src/profiles/catalog.ts`: `claude-code` and `rust` install command changes (within the existing `tool-profile-catalog` contract — profile names and volume declarations are unchanged).
- Specs: `openspec/specs/container-launch/spec.md`, `openspec/specs/volume-manager/spec.md`.
- No changes to config schema, CLI surface, or the runtime adapter interface.
