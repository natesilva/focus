## Why

Currently `focus` starts a fresh container on every invocation, discarding any running state and failing to reuse existing containers. Phase 5 makes `focus` attach to an already-running container when one exists, and handles the case where the configuration changed since the container was started.

## What Changes

- Container identity is computed from the project directory path + a hash of the resolved tool config, enabling attach vs. launch decisions
- On invocation, `focus` checks if a container with the current identity is already running and attaches rather than starting a new one
- If a container is running but the config hash has changed, `focus` detects the mismatch and prompts the user to rebuild
- `focus stop` is fully implemented: stops the running container for the current directory and cleans up its registry entry
- `focus status` is fully implemented: reports whether a container is running and, if so, its identity
- Orphaned container cleanup: stopped containers whose registry entries are stale are pruned on launch

## Capabilities

### New Capabilities
- `container-identity`: Computes and stores the identity key (directory path + config hash) that uniquely identifies a container run; used for attach/rebuild decisions
- `container-lifecycle`: Attach-or-launch logic, stop, status, and orphan cleanup behaviors that build on container identity

### Modified Capabilities
- `container-launch`: Add identity-check before launch; skip launch and attach when identity matches a running container
- `cli-entrypoint`: `focus stop` and `focus status` are now fully wired (they exist in the spec but lacked implementation depth — requirements will be extended to cover the rebuild-prompt and orphan-cleanup flows)

## Impact

- `src/container/` — new identity module; lifecycle module updates
- `src/commands/run.ts`, `stop.ts`, `status.ts` — wire identity and lifecycle logic
- XDG state dir (`~/.local/state/focus/`) — registry file for running containers
