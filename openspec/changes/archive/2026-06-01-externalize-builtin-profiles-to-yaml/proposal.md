## Why

Built-in tool profiles (git, node, claude-code, etc.) are hardcoded as TypeScript objects in `src/profiles/catalog.ts`, while user-defined custom profiles use a portable YAML format with identical semantics. Consolidating both on the same YAML format removes the asymmetry, makes it possible to add or update built-in profiles without touching source code, and lets advanced users override a built-in by placing a same-named file in their config directory.

## What Changes

- Extract each built-in profile from `src/profiles/catalog.ts` into its own `src/profiles/builtins/<name>.yaml` file using the existing custom profile YAML schema.
- Add a built-in profile loader that reads YAML files from the bundled `builtins/` directory at startup, using the same Zod schema and parsing path as `loadCustomProfiles`.
- Remove the hardcoded `BUILTIN_PROFILES` array from `catalog.ts`; replace it with the output of the new loader.
- The resolution order (custom overrides built-in) is unchanged.
- No changes to the public `Profile` type, the `getProfile` / `resolveProfiles` API, or any downstream consumers (image builder, volume manager, etc.).

## Capabilities

### New Capabilities
- `builtin-profile-yaml-loader`: Loader that reads bundled YAML files from `src/profiles/builtins/` and surfaces them as the built-in profile catalog.

### Modified Capabilities
- `tool-profile-catalog`: The source of built-in profiles changes from TypeScript literals to bundled YAML files; the resolution and override semantics are unchanged, but the loading path gains a YAML-file step.

## Impact

- **Modified files**: `src/profiles/catalog.ts` (replaced with a YAML-backed loader), new `src/profiles/builtins/*.yaml` files (one per current built-in profile).
- **Unchanged**: `src/profiles/types.ts`, `src/profiles/custom.ts`, `src/profiles/index.ts`, all callers (`image-builder.ts`, `volumes.ts`, etc.).
- **Tests**: `profiles.test.ts` continues to exercise named profile lookups; the assertions still pass because the profile data is identical — only its storage format changes.
- **Distribution**: The `builtins/` directory must be included in the published package alongside the compiled output; `package.json` `files` field will need updating.
