## 1. Update Types

- [x] 1.1 In `src/profiles/types.ts`, replace `files: string[]` with `files: Record<string, { json: unknown } | { text: string } | null>`

## 2. Update Custom Profile Parser

- [x] 2.1 In `src/profiles/custom.ts`, replace the `files` Zod schema from `z.array(z.string()).default([])` to a `z.record(...)` shape accepting `null`, `{ json: z.unknown() }`, or `{ text: z.string() }`, defaulting to `{}`
- [x] 2.2 Update the `profiles.set(...)` call to pass `data.files` using the new type

## 3. Update Built-in Catalog

- [x] 3.1 In `src/profiles/catalog.ts`, change the `claude-code` profile's `files` from `["~/.claude.json"]` to `{ "~/.claude.json": { json: {} } }`
- [x] 3.2 Update any other built-in profiles that declare `files` (currently none besides `claude-code`, but verify)

## 4. Update Volume Manager

- [x] 4.1 In `src/volumes.ts`, update `resolveFileMounts` to iterate `Object.entries(profile.files)` instead of `profile.files`
- [x] 4.2 Replace the unconditional `writeFile(hostPath, '')` with a helper that serializes init content: `null` → `''`, `{ json: v }` → `JSON.stringify(v, null, 2)`, `{ text: s }` → `s`

## 5. Update Tests

- [x] 5.1 In `src/profiles/profiles.test.ts`, update the `claude-code declares ~/.claude.json in files` test to check the map shape: `profile?.files['~/.claude.json']` exists and has `json` init
- [x] 5.2 Update any custom profile loading tests that use the `files` array syntax to use the new map syntax
- [x] 5.3 In `src/volumes.test.ts`, update file mount tests to pass `files` as a map; add cases for `null`, `{ json }`, and `{ text }` init content
- [x] 5.4 Add a test that a profile with `files` as an array throws a validation error (rejects old format)

## 6. Verify

- [x] 6.1 Run `node --run test` and confirm all tests pass
- [x] 6.2 Run `tsc --noEmit` and confirm no type errors
