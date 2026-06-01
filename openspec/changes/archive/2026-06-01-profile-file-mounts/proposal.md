## Why

Claude Code writes account identity state to `~/.claude.json` at the home root. This file is not covered by any existing volume slot, so it is lost on every new container — causing Claude Code to prompt for login even though valid tokens exist in the already-persisted `~/.claude/` directory. Other tools have the same pattern: a single config/auth file at the home root, outside their standard dotdir. There is no way to express this in a tool profile today.

## What Changes

- Add a `files` field to the `Profile` type (both built-in and custom YAML) as a list of container-path strings.
- Each listed path is bind-mounted from a profile-namespaced host location (`<focusVolumesDir>/<profile-name>/<filename>`). The host file is created empty if it does not exist.
- Add `files: ["~/.claude.json"]` to the built-in `claude-code` profile.
- No entries in the global SLOTS catalog are needed — file persistence is declared entirely at the profile level.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `volume-manager`: Profile-level file mounts with automatic host-side path derivation and creation.
- `tool-profile-catalog`: Add optional `files` field to the profile schema (built-in and custom YAML).

## Impact

- `src/profiles/types.ts`: Add optional `files?: string[]` to `Profile`.
- `src/profiles/custom.ts`: Parse `files` from custom profile YAML.
- `src/profiles/catalog.ts`: Add `files: ['~/.claude.json']` to the `claude-code` profile.
- `src/volumes.ts`: New `resolveFileMounts(profiles, xdg, hostUid)` function; called alongside `resolveVolumeMounts` at container launch.
- No changes to container launch or runtime adapters beyond consuming the additional mounts.
- No breaking changes — `files` is optional and defaults to empty.
