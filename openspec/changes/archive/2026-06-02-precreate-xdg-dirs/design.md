## Context

`src/config/xdg.ts` currently only computes XDG paths — it never touches disk. As a result, every module that reads from those paths must defensively tolerate `ENOENT`. The `src/profiles/loader.ts` has an explicit guard for a missing profiles directory; `src/config/global.ts` handles a missing config file. Both workarounds exist because focus never establishes the directories it depends on.

The immediate user-visible symptom: a user who wants to add a custom tool profile must manually `mkdir -p ~/.config/focus/profiles` before the profile is picked up. There's no error message guiding them — the profiles directory is silently skipped.

## Goals / Non-Goals

**Goals:**
- Ensure all four focus XDG directories and the profiles subdirectory exist before any subcommand runs.
- Keep the implementation idempotent — safe to run on every invocation.
- Remove the now-dead directory-ENOENT guard in `loader.ts`.

**Non-Goals:**
- Tracking or reporting "first run" state.
- Creating any directories beyond the known focus tree (no speculative future paths).
- Changing how XDG paths are *resolved* (env var override behavior is unchanged).

## Decisions

### Add `ensureXdgDirs()` to `xdg.ts`, not a separate module

Path resolution and directory creation are tightly coupled — both operate on the same set of paths. Co-locating them in `xdg.ts` avoids a thin module that just imports from `xdg.ts` and immediately calls it. The function is exported so it can be tested independently.

**Alternative considered:** A dedicated `src/init.ts` startup module. Rejected — unnecessary indirection for a function this small.

### Call `ensureXdgDirs()` in `cli.ts main()`, unconditionally

Running it on every invocation (not just `focus init`) ensures directories exist before any read operation. The `{ recursive: true }` option makes repeated calls free — the syscall short-circuits if the path exists.

**Alternative considered:** Lazy creation inside each consumer (`loadGlobalConfig`, `loadCustomProfiles`, etc.). Rejected — it distributes responsibility across consumers and doesn't solve the full tree gap.

### Directories to create

```
~/.config/focus/
~/.config/focus/profiles/    ← the direct UX pain point
~/.local/share/focus/volumes/
~/.cache/focus/
~/.local/state/focus/
```

`focusVolumesDir` is two levels deep under `dataHome` (`focus/volumes`), so `{ recursive: true }` handles the intermediate `focus/` level automatically.

### Remove the `required: false` ENOENT guard in `loader.ts`

After `ensureXdgDirs()` runs at startup, the profiles directory always exists. The guard (`if ENOENT and !required, return empty map`) can never be reached. Removing dead code reduces confusion about why it's there.

**Note:** The file-level ENOENT guard in `loadGlobalConfig` (for `config.yaml` itself) is intentional and stays — the directory exists but the file is optional.

## Risks / Trade-offs

- **Startup I/O on every invocation** — five `mkdir` calls with `recursive: true`. Each is effectively a stat + conditional create; negligible on any modern filesystem.
- **Permissions edge case** — if `$HOME` or an intermediate directory is read-only, `ensureXdgDirs()` will throw. This is the correct behavior: fail loudly rather than silently proceeding to a broken state.
