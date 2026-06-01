## Why

When a user is inside a `focus` container, the shell prompt is indistinguishable from any other bash session — there is no visual signal that they are in a managed environment for a specific project. This makes it easy to lose context when switching between terminal tabs or when multiple projects are in use.

## What Changes

- A styled bash prompt is injected into every `focus` container shell session, displaying the `[focus]` badge and the project name
- The prompt style is configurable between single-line and two-line layouts
- The prompt can be disabled entirely for users who manage their own prompt (custom dotfiles, starship, etc.)
- A new `shell` section is added to the project config schema

## Capabilities

### New Capabilities

- `shell-prompt`: Branded bash prompt injected at container start, configurable via `shell.prompt` in `.focus.yaml`

### Modified Capabilities

- `project-config`: New optional `shell` field added to the project config schema with a `prompt` sub-field (`true | false | { style: "inline" | "two-line" }`)

## Impact

- `src/entrypoint.sh`: writes `/etc/bash.bashrc` prompt block at container start (before `exec runuser`)
- `src/container.ts`: passes `FOCUS_PROJECT=<basename(cwd)>` via `StartOptions.env`
- `src/config/resolver.ts` and related config files: adds `shell.prompt` to the project config schema
- No changes to runtime adapters, image builder, or tool profiles
