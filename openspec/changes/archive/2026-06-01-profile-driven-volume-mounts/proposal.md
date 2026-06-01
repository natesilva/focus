## Why

The `SLOTS` constant in `volumes.ts` unconditionally mounts three volumes (claude, ssh, git) on every container regardless of which profiles are active. `profile.volumes` already exists as a string array on each Profile and carries the right declarations (`["claude"]`, `["ssh"]`), but is completely inert — it contributes to the config hash but drives no actual mount behavior. The two systems are redundant and contradictory.

## What Changes

- **Remove** the `SLOTS` catalog and `resolveVolumeMounts` function from `volumes.ts`
- **Remove** the git slot entirely — the `git` profile installs the binary; host `~/.gitconfig` passthrough is deferred to the future "scopes" feature
- **Wire up** `profile.volumes` strings to XDG-backed directory mount resolution: volume names are used verbatim on both sides — when a profile declares `volumes: [".claude"]`, the system resolves it to `~/.local/share/focus/volumes/.claude/` on the host and mounts it at `/home/focususer/.claude` in the container, with no name translation layer
- **Update** `catalog.ts` volume declarations from bare names (`"claude"`, `"ssh"`) to dotdir names (`".claude"`, `".ssh"`) to match the convention
- **Update** `buildMounts` in `container.ts` to call only the profile-based resolvers (no separate volume-slots path)

## Capabilities

### New Capabilities

_None — this is a refactor of existing behavior._

### Modified Capabilities

- `volume-manager`: The volume resolution contract changes — `profile.volumes` strings now drive XDG directory mounts; the unconditional SLOTS catalog is removed; git host-passthrough is removed
- `tool-profile-catalog`: The `git` profile no longer declares volume behavior (git config passthrough removed); `volumes` declarations on `claude-code` and `ssh` profiles are now load-bearing

## Impact

- `src/volumes.ts`: Remove `SLOTS`, `VolumeSlot`, `DirectorySlot`, `FileSlot`, `resolveVolumeMounts`; add profile-aware volume resolver
- `src/container.ts`: `buildMounts` removes the `resolveVolumeMounts` call
- `src/profiles/catalog.ts`: `claude-code` profile `volumes: ["claude"]` → `volumes: [".claude"]`; `ssh` profile `volumes: ["ssh"]` → `volumes: [".ssh"]`; `git` profile unchanged (already has no volumes/files)
- `src/volumes.test.ts`: Tests for `resolveVolumeMounts` removed; new tests for profile-driven resolution
- No config schema changes; no user-visible CLI changes
