## Why

An empty file is not valid JSON. When `~/.claude.json` is created as an empty file on first use, Claude Code tries to parse it, fails, and errors out. Profiles need a way to declare what initial content a file should be seeded with so tools get a parseable starting state.

## What Changes

- **BREAKING**: `files` in the profile schema changes from `string[]` to `Record<string, FileInit | null>`, where `FileInit` is `{ json: unknown }` or `{ text: string }`. The string array form is removed entirely.
- The built-in `claude-code` profile updates its `~/.claude.json` declaration to seed with `{ json: {} }`.
- `resolveFileMounts` uses the declared init content (instead of always writing `''`) when creating a missing host file.
- The custom YAML profile parser is updated to accept and validate the new map shape.

## Capabilities

### New Capabilities
- (none — this modifies an existing capability)

### Modified Capabilities
- `volume-manager`: The "Profile-level file mounts" requirement changes — host files are no longer always created empty; init content from the profile declaration is used instead.
- `tool-profile-catalog`: The `files` field schema changes from a string array to a map; the `claude-code` profile's declaration changes accordingly.

## Impact

- `src/profiles/types.ts` — `Profile.files` type
- `src/profiles/custom.ts` — YAML parser and validation for the new map shape
- `src/profiles/index.ts` — built-in `claude-code` profile definition
- `src/volumes.ts` — `resolveFileMounts` init content logic
- All related tests
