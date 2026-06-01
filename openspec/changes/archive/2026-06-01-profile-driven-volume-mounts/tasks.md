## 1. Remove SLOTS from volumes.ts

- [x] 1.1 Delete the `DirectorySlot`, `FileSlot`, and `VolumeSlot` type definitions
- [x] 1.2 Delete the `SLOTS` constant
- [x] 1.3 Delete the `resolveVolumeMounts` function and its export
- [x] 1.4 Add `resolveProfileVolumes(profiles: Profile[], xdg: XdgPaths, uid: number): Promise<MountDescriptor[]>` that collects unique volume names across all active profiles and, for each, uses the name verbatim as both the host subdir (`<focusVolumesDir>/<name>`) and container subdir (`<CONTAINER_HOME>/<name>`), mkdir+chowns if absent (with mode `0o700` for `.ssh`), and returns `MountDescriptor[]` — no name translation
- [x] 1.5 Export `resolveProfileVolumes` from `volumes.ts`

## 2. Update catalog.ts

- [x] 2.1 Change `claude-code` profile: `volumes: ["claude"]` → `volumes: [".claude"]`
- [x] 2.2 Change `ssh` profile: `volumes: ["ssh"]` → `volumes: [".ssh"]`

## 3. Update container.ts

- [x] 3.1 Replace the `resolveVolumeMounts(xdg, uid)` call in `buildMounts` with `resolveProfileVolumes(profiles, xdg, uid)` — profiles are already resolved at the call site, so thread them through
- [x] 3.2 Remove the `resolveVolumeMounts` import

## 4. Update tests

- [x] 4.1 Delete the `resolveVolumeMounts` describe block from `volumes.test.ts`
- [x] 4.2 Add a `resolveProfileVolumes` describe block covering: single-profile volume mount, multi-profile volumes, deduplication of duplicate declarations, no volumes → empty list, directory created on first use, idempotent when directory exists, host UID chown on new directories, `.ssh` mode `0700`
- [x] 4.3 Update `container.test.ts` if it references `resolveVolumeMounts` directly

## 5. Verify

- [x] 5.1 Run `node --run test` and confirm all tests pass
- [x] 5.2 Run `tsc --noEmit` and confirm no type errors
