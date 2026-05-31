## 1. Volume Manager Module

- [x] 1.1 Create `src/volumes.ts` with a `VolumeSlot` type and `MountDescriptor` type (hostPath, containerPath, readOnly)
- [x] 1.2 Define the static slot catalog: `claude` (`<focusVolumesDir>/claude` → `~/.claude`), `ssh` (`<focusVolumesDir>/ssh` → `~/.ssh`), `git` (`~/.gitconfig` → `/etc/gitconfig`, read-only)
- [x] 1.3 Implement `resolveVolumeMounts(xdgPaths, hostUid): Promise<MountDescriptor[]>` — creates missing directories, sets ownership and permissions, skips the git slot when `~/.gitconfig` is absent
- [x] 1.4 Ensure the `ssh` volume directory is created with mode `0700`
- [x] 1.5 Write unit tests for `resolveVolumeMounts`: first-use creation, idempotency, missing gitconfig skip, descriptor shape

## 2. Docker Adapter Integration

- [x] 2.1 Add a `mounts?: MountDescriptor[]` field to `StartOptions` in `src/runtime/docker.ts`
- [x] 2.2 Translate each `MountDescriptor` to a `-v hostPath:containerPath[:ro]` argument in `docker.start()`
- [x] 2.3 Write a unit test verifying that `readOnly: true` produces the `:ro` suffix and `readOnly: false` does not

## 3. Container Launch Wiring

- [x] 3.1 Call `resolveVolumeMounts()` in `runContainer()` in `src/container.ts` and pass the result as `mounts` to `docker.start()`
- [x] 3.2 Verify end-to-end: launch `focus`, confirm `~/.claude`, `~/.ssh`, and (if present) `/etc/gitconfig` are visible at the expected paths inside the container
