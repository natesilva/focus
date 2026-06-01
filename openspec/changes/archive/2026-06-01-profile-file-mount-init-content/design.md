## Context

Profile-level file mounts were introduced to persist individual config files (like `~/.claude.json`) across container sessions. The current implementation always creates missing host files as empty strings. This breaks tools that require valid content on startup — Claude Code, for example, tries to parse `~/.claude.json` as JSON and errors on an empty file.

The `files` field on the `Profile` type is currently `string[]`. The fix requires changing it to a map so each declared file can carry an optional init value.

This is a pre-1.0 breaking change. Only the built-in `claude-code` profile uses `files` today, so there are no external consumers to migrate.

## Goals / Non-Goals

**Goals:**
- Allow profiles to declare initial content for file mounts (`json` or `text` variants).
- Seed `~/.claude.json` with `{}` so Claude Code gets a valid empty config on first run.
- Keep the schema minimal — no over-engineering for hypothetical future variants.

**Non-Goals:**
- Supporting a `source` (external file) init variant — no concrete need yet.
- Backward compatibility with the array form of `files` — clean break is correct here.
- Re-seeding files that already exist on the host.

## Decisions

### `files` changes from `string[]` to `Record<string, FileInit | null>`

**Decision**: The profile schema changes to a map where keys are `~/`-prefixed container paths and values are `null` (empty) or a discriminated union `{ json: unknown } | { text: string }`.

**Rationale**: The array form carries no way to attach metadata per entry. A map is the natural shape for key→config associations and is idiomatic in YAML profiles. A discriminated union is explicit and type-safe — no guessing whether a string value is JSON or raw text.

**Alternative considered**: Keep `files` as an array of objects (`{ path: string; init?: FileInit }`). Rejected — the map form is more concise in YAML and already used by the `volumes` concept (name → slot).

### JSON init serialized with `JSON.stringify(value, null, 2)`

**Decision**: When `{ json: value }` is declared, the host file is seeded with `JSON.stringify(value, null, 2)`.

**Rationale**: Pretty-printing is conventional for config files and makes host-side inspection easier. Minified JSON would work but is harder to read.

### Validation at parse time, not at mount time

**Decision**: The custom YAML profile parser validates init content shape (e.g. that `json` is present and serializable) when loading the profile, not when `resolveFileMounts` runs.

**Rationale**: Fail fast — a bad profile declaration should surface immediately when the profile is loaded, not silently at container launch time.

### `null` init remains the explicit "create empty" signal

**Decision**: `null` in the map value means "create an empty file" (current behavior). Omitting the key is not valid — every declared path needs an explicit value.

**Rationale**: Makes intent clear. `null` is self-documenting ("no initial content") and avoids ambiguity about whether a missing value means "empty" or "skip".

## Risks / Trade-offs

- **Schema is breaking** → Correct and intentional at this stage. Any custom profiles using the array form will fail validation until updated. Error message should guide the fix.
- **`json` init accepts `unknown`** → The TypeScript type is permissive. In practice, `JSON.stringify` will throw on non-serializable values (functions, circular refs). Validation at parse time catches obvious cases; edge cases are unlikely in practice.
- **Re-seeding not supported** → If a user wants to reset a file to `{}`, they must delete it manually. This is intentional — `resolveFileMounts` only writes when the host file is absent.
