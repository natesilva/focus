## 1. Schema

- [x] 1.1 Add `prerequisites: string[]` to the `Profile` interface in `src/profiles/types.ts`
- [x] 1.2 Add `prerequisites: z.array(z.string()).default([])` to `ProfileSchema` in `src/profiles/loader.ts`
- [x] 1.3 Update the `profiles.set(name, ...)` call in `loadProfilesFromDir` to include `prerequisites` from parsed data

## 2. Prerequisite Resolution

- [x] 2.1 Rewrite `resolveProfiles` in `src/profiles/index.ts` to compute the transitive closure of all prerequisites using BFS over the merged profile catalog
- [x] 2.2 Implement Kahn's algorithm (BFS-based topological sort) with alphabetical tie-breaking within each frontier; return profiles in topo order
- [x] 2.3 Detect cycles: after Kahn's main loop, if remaining nodes exist (in-degree > 0), throw with the cycle path identified
- [x] 2.4 Detect missing prerequisites: when a profile's prerequisite name is not in the merged catalog, throw an error naming both the declaring profile and the missing prerequisite
- [x] 2.5 Print informational lines to stderr for auto-injected profiles (format: `note: adding "X" (required by Y)`); deduplicate so each injected profile prints once regardless of how many profiles required it

## 3. Image Builder

- [x] 3.1 Remove the internal `sort` call from `generateDockerfile` in `src/image-builder.ts` so it honors the order of the profiles passed in
- [x] 3.2 Verify `computeTag` still sorts alphabetically internally (no change needed, just confirm)

## 4. Builtin Profile Refactoring

- [x] 4.1 Add `prerequisites: [node]` to `src/profiles/builtins/claude-code.yaml` and remove the Node.js install steps (the `curl -fsSL … | bash -` and `apt-get install -y nodejs` lines), keeping only `npm install -g @anthropic-ai/claude-code` and the `apt-get` cache cleanup
- [x] 4.2 Audit remaining builtins (`git`, `ripgrep`, `node`, `python`, `rust`, `ssh`) and confirm none have implicit cross-profile dependencies requiring similar refactoring

## 5. Tests

- [x] 5.1 Update the `generateDockerfile` test in `src/image-builder.test.ts` that asserts alphabetical order — change it to assert that the function respects input order
- [x] 5.2 Add a test for `resolveProfiles` with a profile that has a direct prerequisite: confirm the prerequisite appears in the returned list and comes before the dependent
- [x] 5.3 Add a test for transitive prerequisites (A → B → C): confirm all three are resolved and in correct order
- [x] 5.4 Add a test for duplicate prerequisites: two profiles sharing the same prerequisite; confirm it appears once
- [x] 5.5 Add a test for explicitly listed prerequisite not duplicated: `resolveProfiles(["claude-code", "node"])` returns `node` once
- [x] 5.6 Add a test for missing prerequisite: a profile listing a non-existent prerequisite throws an error naming both profiles
- [x] 5.7 Add a test for cycle detection: two profiles that depend on each other throw with a cycle error
- [x] 5.8 Add a test confirming `claude-code`'s built-in profile declares `prerequisites: ["node"]` and does not include Node.js install commands
- [x] 5.9 Add a test confirming that `resolveProfiles(["claude-code"])` auto-injects `node` and returns it before `claude-code`
