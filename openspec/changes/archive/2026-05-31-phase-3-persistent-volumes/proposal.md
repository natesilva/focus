## Why

Tool credentials (Claude Code auth, SSH keys, Git identity) are wiped on every container restart because they live inside ephemeral container state. Phase 3 introduces persistent volumes so configuration survives across runs — a prerequisite for the tool profiles work in Phase 4.

## What Changes

- Volume lifecycle management: create named volumes on first use, reuse them on subsequent runs
- Predefined volume slots for `claude-code` (`~/.claude`), `ssh` (`~/.ssh`), and `git` (`~/.gitconfig`)
- Container launch wires in the correct host-path → container-path volume mounts
- Volume ownership is set to the non-root container user's UID so reads and writes work without permission errors
- `focus status` reports mounted volumes alongside container state

## Capabilities

### New Capabilities

- `volume-manager`: Lifecycle management for persistent XDG volumes — create, resolve paths, list, and mount into containers

### Modified Capabilities

- `container-launch`: Volume mounts are added to the container start invocation

## Impact

- New module: `src/volumes.ts` (or equivalent)
- `src/container.ts` (or equivalent) gains volume-mount arguments
- No breaking changes to `.focus.yaml` or `config.yaml` schema
- Depends on Phase 2 XDG path resolution (`xdg-paths` spec)
