## Context

Phase 1 hard-codes the container image (`ubuntu:24.04`), network mode, and tool set in `container.ts`. Before Phase 3 (volumes) and Phase 4 (tool profiles) can be built, the system needs a stable config schema and a merge pipeline that all downstream modules can consume.

The CLI currently has no concept of config files. Adding them means threading resolved config from the CLI entry point down into `container.ts` and the runtime adapter.

## Goals / Non-Goals

**Goals:**
- XDG-compliant path resolution usable by all future modules
- Typed, validated config loading for global and per-project config files
- A single `FocusConfig` type that the rest of the codebase consumes
- `focus init` to scaffold a `.focus.yaml`
- Graceful handling of absent config files (sensible defaults, no crashes)

**Non-Goals:**
- Config migration between schema versions
- Runtime backend switching (the Docker backend remains the only backend)
- Tool profiles (Phase 4) — `tools` in config is parsed but not acted on yet
- Volume management (Phase 3) — parsed but not acted on yet

## Decisions

### Zod v4 for schema validation

Config files are external user data (system boundary). Zod provides runtime validation with TypeScript type inference, eliminating a manual parsing layer. Zod v4 is the current major version and avoids the deprecated v3 API.

Alternatives: manual validation (more boilerplate, same safety), `valibot` (similar ergonomics, less ecosystem). Zod v4 is the right call given the project already uses modern Node.js/TS.

### Config merging is shallow-merge by key, not deep-merge

Global config provides defaults for every field. Per-project config overrides specific fields. CLI flags override specific fields. No deep-merging of nested objects — each top-level field is replaced wholesale. This keeps the merge logic trivial and avoids surprising partial-object semantics.

Example: if global config sets `tools: [git]` and project config sets `tools: [node]`, the result is `tools: [node]`, not `[git, node]`.

### `FocusConfig` is the single resolved type

Downstream modules (`container.ts`, future volume/profile modules) import only `FocusConfig`. They never call config loaders directly. This keeps the config subsystem's internals private.

### Missing config files are not errors

If `~/.config/focus/config.yaml` or `.focus.yaml` are absent, the system silently uses defaults. A missing file is expected for new users and fresh project checkouts. An *invalid* file (parse failure) is an error that surfaces immediately.

### New modules under `src/config/`

| Module | Responsibility |
|---|---|
| `src/config/xdg.ts` | Resolve XDG paths, exported as `xdgPaths()` |
| `src/config/global.ts` | Load + validate `~/.config/focus/config.yaml` |
| `src/config/project.ts` | Load + validate `.focus.yaml` from a given directory |
| `src/config/resolver.ts` | Merge global + project + flags → `FocusConfig` |
| `src/commands/init.ts` | `focus init` implementation |

### `focus init` writes a minimal scaffold, refuses to overwrite

The scaffolded `.focus.yaml` contains commented-out fields showing all available options. The command exits with a non-zero code if `.focus.yaml` already exists, to avoid destroying user config.

## Risks / Trade-offs

[`tools` field is parsed but unused] → Acceptable: the field is stored in `FocusConfig` and passed to `container.ts`, which ignores it for now. Phase 4 will consume it. Parsing it now validates the schema early and avoids a later breaking change.

[Config file location on macOS uses XDG, not `~/Library/`] → Intentional per the design doc. No macOS-specific code path is needed.

## Open Questions

None. The design fully covers Phase 2 scope.
