## 1. Add ensureXdgDirs to xdg.ts

- [x] 1.1 Export `ensureXdgDirs()` from `src/config/xdg.ts` that creates all five focus directories using `fs.mkdir` with `{ recursive: true }`

## 2. Wire up startup call

- [x] 2.1 Call `await ensureXdgDirs()` in `cli.ts main()` before the subcommand dispatch block

## 3. Remove dead code

- [x] 3.1 Remove the directory-ENOENT guard (the `required: false` branch) from `loadProfilesFromDir` in `src/profiles/loader.ts`, and simplify the `opts` parameter if it is no longer needed

## 4. Tests

- [x] 4.1 Add unit tests for `ensureXdgDirs()` in `src/config/xdg.test.ts` (or equivalent) covering: all dirs created when absent, no error when dirs already exist
