## Context

`volumes.ts` currently defines `SLOTS`: a fixed, hardcoded array of three `VolumeSlot` objects (claude, ssh, git) consumed by `resolveVolumeMounts`. This function takes no profile input and mounts all three slots unconditionally. Meanwhile, `Profile.volumes` is a `string[]` that carries the same conceptual information (`["claude"]`, `["ssh"]`) but is completely inert — it only participates in the config hash.

The result: redundant parallel systems with no real connection, and volumes mounted even when the corresponding profiles are not active.

## Goals / Non-Goals

**Goals:**
- Delete `SLOTS`, `resolveVolumeMounts`, and the associated type definitions (`VolumeSlot`, `DirectorySlot`, `FileSlot`)
- Make `profile.volumes` strings drive XDG directory mount resolution
- Remove the git host-passthrough mount (deferred to scopes feature)
- Keep `resolveFileMounts` unchanged

**Non-Goals:**
- Changing the `Profile` type shape or YAML schema
- Implementing volume scoping (`global`/`project`/`host`) — that is a future feature
- Changing the entrypoint symlink logic
- Any user-visible CLI changes

## Decisions

### Decision: Merge volume resolution into `resolveFileMounts` or write a new function?

**Options considered:**
1. Add profile-aware directory mount logic into `resolveFileMounts` (one function)
2. Write a new `resolveVolumeMounts(profiles, xdg, uid)` with the same name but a new signature
3. Write a new `resolveProfileVolumes(profiles, xdg, uid)` function

**Choice: Option 3 — new `resolveProfileVolumes` function.**

Rationale: `resolveFileMounts` handles individual file persistence; volume mounts are directory-level. Keeping them separate maintains a clear single responsibility per function. Using a new name avoids confusion with the old function in git history and in tests.

### Decision: How to handle the `ssh` mode (0700)?

The `ssh` slot had `mode: 0o700` baked into SLOTS. With SLOTS gone, this needs to live somewhere.

**Options considered:**
1. Hardcode: `if (volumeName === 'ssh') mode = 0o700`
2. Add a `volumeModes` map to `volumes.ts` keyed by volume name
3. Add a `mode` field to the `Profile` type per volume declaration

**Choice: Option 1 — hardcode the ssh exception.**

Rationale: There is exactly one case and likely will remain so (SSH is the only POSIX tool that refuses to run if its key directory has loose permissions). Adding generalized machinery (option 2/3) for a single known case is premature. The hardcode is a one-liner with an explanatory comment.

### Decision: What happens to the git slot?

The git slot was a `FileSlot` pointing at the host's actual `~/.gitconfig`. This is categorically different from the XDG-backed directory volumes — it's a host-path passthrough, not a persistence mechanism.

**Choice: Remove entirely.** The `git` profile installs the git binary; git config passthrough will be addressed when the "volume scoping" future feature is implemented (`scope: host`). The `git` profile in `catalog.ts` already has `volumes: []` and `files: {}`, so no catalog changes are needed.

### Decision: Volume names are used verbatim, no mapping

Volume names in `profile.volumes` are used as-is for both the XDG host path (`<focusVolumesDir>/<name>`) and the container path (`<CONTAINER_HOME>/<name>`). No translation table. The current values happen to be `.claude` and `.ssh`, but the resolver makes no assumption about the form a name takes.

This eliminates the implicit `claude` → `.claude` convention that was baked into SLOTS. The catalog entries in `catalog.ts` update from `["claude"]`/`["ssh"]` to `[".claude"]`/`[".ssh"]`.

The ssh mode hardcode keys off `.ssh` (not `ssh`).

## Risks / Trade-offs

- **Git config no longer passed through**: Users who rely on git inside a container and had `git` in their tools list will no longer see their `~/.gitconfig` automatically. This is intentional and documented; a scopes-based solution will restore it cleanly.
- **Pre-existing `SLOTS` tests deleted**: `resolveVolumeMounts` test suite goes away. Replaced by tests for `resolveProfileVolumes`. Test coverage is maintained, just reorganized.
- **Hardcoded ssh mode**: If a future volume ever needs a non-default mode, the hardcode will need to be revisited. Low risk given the scoping feature will redesign this area anyway.
