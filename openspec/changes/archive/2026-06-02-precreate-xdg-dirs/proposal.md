## Why

Users who want to add a custom tool profile must manually create `~/.config/focus/profiles/` before placing a `.yaml` file there — focus gives no hint that the directory is missing. More broadly, every module that reads from an XDG path is forced to defensively swallow `ENOENT` errors, masking the underlying gap: focus never creates the directories it depends on.

## What Changes

- A new `ensureXdgDirs()` function is added to `src/config/xdg.ts` that idempotently creates the full focus XDG directory tree on every invocation.
- `src/cli.ts` calls `ensureXdgDirs()` once at startup, before any subcommand runs.
- The ENOENT guard in `src/profiles/loader.ts` for missing *directories* (the `required: false` path) becomes dead code and can be removed.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `xdg-paths`: Adding a requirement that the focus XDG directory tree is created on startup, not just resolved.

## Impact

- `src/config/xdg.ts` — new exported function `ensureXdgDirs()`
- `src/cli.ts` — one `await ensureXdgDirs()` call in `main()`
- `src/profiles/loader.ts` — remove now-unreachable directory-ENOENT branch (`required: false` path)
