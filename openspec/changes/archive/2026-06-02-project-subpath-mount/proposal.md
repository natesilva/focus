## Why

The current working directory is mounted at `/focus` in every container, so git worktrees created by tools like Claude Code land outside the container's managed namespace and every project shares the same path for per-project harness settings. Mounting the project at `/focus/<dirname>` instead gives siblings a real home and gives each project a distinct in-container path.

## What Changes

- The project directory is mounted at `/focus/<dirname>` (e.g. `~/dev/api-server` → `/focus/api-server`) instead of `/focus`
- A per-project named volume is mounted at `/focus`, providing persistent storage for git worktrees created as siblings of the project directory
- The container start workdir and exec workdir change from `/focus` to `/focus/<dirname>`
- The entrypoint `cd` target changes from `/focus` to `/focus/$FOCUS_PROJECT`
- `git worktree prune` runs automatically in the entrypoint on each container start
- The config hash gains a layout version constant, forcing a one-time rebuild of all existing containers
- **BREAKING**: Existing running containers will be rebuilt on next `focus shell` due to the config hash change

## Capabilities

### New Capabilities

- `project-workspace-volume`: Per-project named Docker/Apple Containers volume (`focus-ws-<hash8>`) mounted at `/focus`, providing a persistent namespace for git worktrees and per-project harness isolation

### Modified Capabilities

- `container-launch`: Project bind-mount target changes from `/focus` to `/focus/<dirname>`; exec workdir changes to match; adapter `exec()` signature gains an optional `workdir` parameter
- `volume-manager`: No requirement change, but the new workspace volume is a named volume managed by the container runtime, not by the XDG volumes path — this is an implementation note, not a spec change

## Impact

- `src/runtime/docker.ts`: `start()` mount args, `buildExecArgs()` workdir, `exec()` signature
- `src/runtime/apple-containers.ts`: `start()` mount args, `exec()` workdir, `exec()` signature
- `src/runtime/adapter.ts`: `RuntimeAdapter.exec()` method signature
- `src/container.ts`: `runContainer()` workspace volume name, `attachContainer()` workdir arg, `configHash()` layout version
- `src/entrypoint.sh`: `cd` target, `git worktree prune` call
- All related test files for the above modules
- Future `focus prune` command: workspace volumes are named `focus-ws-<hash8>` mirroring container names `focus-<hash8>`, enabling paired cleanup without requiring volume labels
