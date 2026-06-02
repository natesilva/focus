## Why

After mounting the project at `/focus/<dirname>`, the default shell prompt became redundant: `[focus · my-app] /focus/my-app` repeats both the tool name and the project name. Renaming the container-internal mount root to `/work` and simplifying the prompt label to `[focus]` eliminates the redundancy, yielding a clean `[focus] /work/my-app`.

## What Changes

- The workspace volume (previously mounted at `/focus` inside the container) is now mounted at `/work`
- The project bind-mount (previously at `/focus/<dirname>`) is now at `/work/<dirname>`
- The shell prompt label changes from `[focus · <project>]` to `[focus]`
- **BREAKING**: All container-internal paths change from `/focus/...` to `/work/...`; existing running containers will be detected as stale (via `layoutVersion` bump) and rebuilt on next `focus` invocation

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `project-workspace-volume`: Mount root changes from `/focus` to `/work`; project bind-mount changes from `/focus/<dirname>` to `/work/<dirname>`
- `shell-prompt`: Label format changes from `[focus · <project>]` to `[focus]`; path display now shows `/work/<dirname>` instead of `/focus/<dirname>`
- `container-launch`: Working directory changes from `/focus/<dirname>` to `/work/<dirname>`

## Impact

- `src/runtime/docker.ts`: two mount path strings
- `src/runtime/apple-containers.ts`: two mount path strings
- `src/container.ts`: workdir string, `layoutVersion` bump (2 → 3)
- `src/entrypoint.sh`: `cd`/`git` paths, PS1 label
- Test files: hardcoded `/focus/api-server` paths become `/work/api-server`
- Specs: `project-workspace-volume`, `shell-prompt`, `container-launch`, `apple-containers-runtime`
- `CLAUDE.md`: key design decision (mount path)
- `docs/implemented-features.md`: description of implemented features
