## Why

Phase 1 hard-codes the container image, tool set, and runtime. Every behavioral decision must be driven by user-controlled configuration before tool profiles and volume management (Phases 3–4) can be built on top of it.

## What Changes

- Add XDG-compliant path resolution for all config and data locations
- Add global config at `~/.config/focus/config.yaml` (preferred runtime, default tool list)
- Add per-project config at `.focus.yaml` (tool list, network mode, runtime override)
- Implement config merging: global defaults → per-project overrides → CLI flags
- Add `focus init` subcommand to scaffold a `.focus.yaml` in the current directory
- Replace hard-coded `IMAGE` constant in `container.ts` with resolved config values

## Capabilities

### New Capabilities

- `xdg-paths`: Resolves XDG Base Directory paths (`config`, `data`, `cache`, `state`) respecting environment variable overrides, used by all config and volume subsystems
- `global-config`: Loads and validates `~/.config/focus/config.yaml`; provides typed defaults when the file is absent
- `project-config`: Loads and validates `.focus.yaml` from the current project directory; optional (no file = use defaults)
- `config-resolver`: Merges global config + project config + CLI flags into a single resolved `FocusConfig` value consumed by the rest of the CLI
- `focus-init`: `focus init` scaffolds a `.focus.yaml` in the current directory, refusing to overwrite an existing one

### Modified Capabilities

- `cli-entrypoint`: Adds the `init` subcommand and threads resolved config into `runContainer`
- `container-launch`: Accepts config-driven image and network mode instead of hard-coded values

## Impact

- `src/cli.ts`: new `init` subcommand; passes resolved config to container functions
- `src/container.ts`: `runContainer` receives config; no more hard-coded `IMAGE`
- New modules: `src/config/xdg.ts`, `src/config/global.ts`, `src/config/project.ts`, `src/config/resolver.ts`, `src/commands/init.ts`
- New dependency: `zod` (v4) for config schema validation
- No breaking changes to the external CLI surface (existing commands keep their behavior with sensible defaults)
