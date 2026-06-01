## 1. Create builtin YAML files

- [x] 1.1 Create `src/profiles/builtins/git.yaml` with the git profile definition
- [x] 1.2 Create `src/profiles/builtins/ripgrep.yaml` with the ripgrep profile definition
- [x] 1.3 Create `src/profiles/builtins/ssh.yaml` with the ssh profile definition
- [x] 1.4 Create `src/profiles/builtins/node.yaml` with the node profile definition
- [x] 1.5 Create `src/profiles/builtins/python.yaml` with the python profile definition
- [x] 1.6 Create `src/profiles/builtins/rust.yaml` with the rust profile definition
- [x] 1.7 Create `src/profiles/builtins/claude-code.yaml` with the claude-code profile definition

## 2. Refactor profile loader

- [x] 2.1 Extract a shared `loadProfilesFromDir(dir: string, opts: { required: boolean }): Promise<Map<string, Profile>>` helper in `catalog.ts` (or a new `loader.ts`) that contains the read/parse/validate loop currently in `loadCustomProfiles`
- [x] 2.2 Implement `loadBuiltinProfiles(): Promise<Map<string, Profile>>` using `import.meta.dirname` to locate `builtins/` and calling the shared helper with `{ required: true }`
- [x] 2.3 Refactor `loadCustomProfiles` in `custom.ts` to delegate its read/parse loop to the shared helper with `{ required: false }`
- [x] 2.4 Remove the `BUILTIN_PROFILES` constant and the synchronous `getBuiltinProfile` export from `catalog.ts`

## 3. Update resolution logic

- [x] 3.1 Update `index.ts` to call `loadBuiltinProfiles()` alongside `loadCustomProfiles()`, merging results with custom taking precedence
- [x] 3.2 Remove any remaining references to the old synchronous `getBuiltinProfile` function

## 4. Verify and clean up

- [x] 4.1 Run `pnpm typecheck` (or `tsc --noEmit`) and fix any type errors
- [x] 4.2 Run `pnpm test` and confirm all existing profile tests pass without modification
- [x] 4.3 Manually verify that `focus shell` still resolves built-in profiles correctly end-to-end (or via an integration test if available)
