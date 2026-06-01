## Context

Built-in profiles live in `src/profiles/catalog.ts` as a static TypeScript array. The `getBuiltinProfile(name)` function is synchronous. Custom profiles use the same `Profile` shape but are loaded from `~/.config/focus/profiles/<name>.yaml` via an async `loadCustomProfiles` function in `custom.ts`. The two loaders are structurally identical but their storage formats differ.

`index.ts` already calls `loadCustomProfiles` asynchronously, then falls back to the synchronous built-in lookup — so the call site is already async-aware.

## Goals / Non-Goals

**Goals:**
- Every built-in profile stored as `src/profiles/builtins/<name>.yaml`
- A new loader reads those files at runtime, identical in approach to `loadCustomProfiles`
- No changes to the public `resolveProfiles` / `getProfile` API
- No behavioral changes: same profiles, same data, same override semantics

**Non-Goals:**
- Caching or performance optimization of the load path
- Schema changes to the `Profile` type
- Changes to the custom profile loader
- Runtime discovery of builtins from user-configurable paths (custom profiles already cover that)

## Decisions

### Directory location: `src/profiles/builtins/`

The builtins directory sits adjacent to the loader code. At runtime the loader locates it using `import.meta.dirname` (Node 22+), which resolves to the directory containing the executing `.ts` file — i.e. `src/profiles/`. This is reliable for both direct Node.js execution (`node src/cli.ts`) and any future compiled output, as long as the YAML files travel alongside the source.

Alternative considered: embed YAML as template literals inside `catalog.ts`. Rejected — defeats the purpose of externalizing; files would still be code.

### API shape: `loadBuiltinProfiles(): Promise<Map<string, Profile>>`

Mirrors `loadCustomProfiles` in signature and return type. `index.ts` calls both, then merges (custom wins on collision). The existing sync `getBuiltinProfile` is replaced; `BUILTIN_PROFILES` array is removed.

Alternative considered: keep `getBuiltinProfile` synchronous by preloading at module top level with a top-level `await`. Rejected — top-level await in a non-`"module"` entrypoint context is fragile and harder to test in isolation.

### Loader reuse: shared `parseProfileDir` helper

`loadBuiltinProfiles` and `loadCustomProfiles` differ only in directory path and error handling (missing builtins dir is a hard error; missing custom dir is a soft no-op). Extract a shared `loadProfilesFromDir(dir, { required })` helper to avoid duplicating the readdir/parse loop.

Alternative considered: keep both loaders fully separate. Acceptable for the current size, but the shared helper prevents future drift between the two parsing paths.

### YAML file naming: `<name>.yaml`, one per profile

Each built-in becomes `git.yaml`, `node.yaml`, `claude-code.yaml`, etc. The file name (minus `.yaml`) is the profile name, identical to the custom profiles convention.

## Risks / Trade-offs

- **YAML files must ship with the binary.** If the project is ever packaged with a bundler that strips non-JS assets, the builtins directory will silently disappear. Mitigation: add a startup assertion that at least one YAML file is found; document the requirement in `package.json` `files` when publishing.
- **Missing builtins dir is now a hard failure.** If a packaging step omits the directory, the tool crashes at startup rather than silently losing built-ins. This is the desired behavior — fail loudly rather than silently present an empty catalog.
- **No caching.** Both loaders re-read the filesystem on every call. For the expected call frequency (once per `focus` invocation) this is negligible. If profiling ever shows otherwise, a module-level cache can be added without touching the public API.

## Migration Plan

1. Create `src/profiles/builtins/` with one YAML file per current built-in.
2. Add `loadBuiltinProfiles` (or refactor to shared helper) in `catalog.ts`.
3. Update `index.ts` to call `loadBuiltinProfiles` alongside `loadCustomProfiles`.
4. Remove the `BUILTIN_PROFILES` constant and synchronous `getBuiltinProfile` from `catalog.ts`.
5. Run existing tests — no assertion changes expected since profile data is identical.
6. Update `package.json` `files` if the project is published.

No rollback complexity: this is a pure refactor with no data migration or protocol change. Reverting means restoring the original `catalog.ts`.

## Open Questions

- None. The scope is narrow enough that all decisions above are low-risk and reversible.
