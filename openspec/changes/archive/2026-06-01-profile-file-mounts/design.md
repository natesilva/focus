## Context

The volume manager currently handles two kinds of persistence: named directory slots (e.g. `claude`, `ssh`) and a single passive file slot (`.gitconfig`, skipped if absent). Profiles reference directory slots by name via `volumes: [...]`.

There is no mechanism for a profile to declare that an individual file should be persisted. Adding each such file as a special-cased entry in the global SLOTS catalog is unscalable and requires code changes for every new tool. The solution is to let profiles declare file mounts directly.

## Goals / Non-Goals

**Goals:**
- Let any profile (built-in or custom YAML) declare file persistence via a `files` key.
- Derive the host path automatically — users never specify it.
- Auto-create the host file (empty) if it doesn't exist, so the bind-mount is always valid.
- Register `~/.claude.json` in the `claude-code` profile as the first use case.

**Non-Goals:**
- Allowing users to specify custom host paths.
- Supporting non-empty default content (files are always created empty).
- Mounting files outside the container user's home directory (absolute paths not supported in this iteration).
- Changing the existing named directory slot system.
- Any changes to container launch or runtime adapters beyond passing additional mounts.

## Decisions

### Profile-level declaration, not a global slot catalog

**Decision**: File mounts are declared in the profile (`files: ["~/.claude.json"]`), not as entries in the global `SLOTS` array in `volumes.ts`.

**Rationale**: The SLOTS catalog is for infrastructure-level slots shared across many tools (e.g. `ssh`, `git`). A tool's own config file is purely that tool's concern and should be colocated with its profile definition. This lets custom profile authors add file persistence without touching core code.

### Host path derived as `<focusVolumesDir>/<profile-name>/<filename>`

**Decision**: Given a profile named `claude-code` and a container path `~/.claude.json`, the host path is `<focusVolumesDir>/claude-code/.claude.json`.

**Rationale**: Namespacing by profile name prevents collisions between profiles that might persist files with the same name (e.g. two profiles both declaring `~/.config.json`). Using just the filename (not the full container subpath) keeps host paths short and readable.

**Alternative considered**: Mirror the full container path under a `files/` root (e.g. `<focusVolumesDir>/files/home/focususer/.claude.json`). Rejected — too verbose, and the profile namespace already provides uniqueness.

### Container paths must use `~/` prefix; absolute paths are not supported

**Decision**: All paths in `files` must begin with `~/`. The resolver expands `~` to `CONTAINER_HOME` (`/home/focususer`). Absolute paths (e.g. `/etc/my-tool.conf`) are rejected with a validation error.

**Rationale**: Auth and session state — the primary use case for file persistence — lives in the home directory. Supporting absolute paths requires a host-path derivation strategy that handles collisions (two files at different absolute paths sharing a filename), which adds complexity for a case with no known use. Scoping to `~/` keeps the derivation unambiguous and the schema self-documenting. Absolute path support can be added later when a concrete need arises.

### Always create empty — no configurable default content

**Decision**: If the host file doesn't exist, it is created with an empty string (`''`). No `default` field in the profile schema.

**Rationale**: Requiring users to specify default content (e.g. `default: "{}"`) is an unnecessary burden. Applications that require valid JSON will write it on first run; they should handle an empty or absent file gracefully. Hiding this complexity keeps the profile schema minimal.

### New `resolveFileMounts` function, separate from `resolveVolumeMounts`

**Decision**: Add a new exported function `resolveFileMounts(profiles, xdg, hostUid)` rather than merging file-mount logic into `resolveVolumeMounts`.

**Rationale**: `resolveVolumeMounts` operates on the fixed SLOTS catalog and takes no profile input. Mixing profile-driven and catalog-driven logic in one function would require a signature change and entangle two concerns. A separate function is easier to test and keeps both functions focused.

The call site (container launch) combines both:
```ts
const mounts = [
  ...await resolveVolumeMounts(xdg, hostUid),
  ...await resolveFileMounts(activeProfiles, xdg, hostUid),
];
```

## Risks / Trade-offs

- **Stale data after logout** → Persisted files like `~/.claude.json` survive container teardown. A logout inside the container invalidates tokens in `.credentials.json` but `~/.claude.json` still holds the old `oauthAccount` block. This is harmless — Claude Code overwrites it on next login.
- **Empty file may cause parse errors** → If a tool cannot handle an empty file on first start, it will error. This is the tool's responsibility; focus creates the file so the bind-mount succeeds, not to seed valid content. Document this expectation.
- **Symlink entrypoint compatibility** → The entrypoint symlink loop (`for item in FOCUS_VOLUME_HOME/.[!.]*`) picks up bind-mounted dotfiles in `/home/focususer` and symlinks them into the divergent home automatically. No entrypoint changes needed.
