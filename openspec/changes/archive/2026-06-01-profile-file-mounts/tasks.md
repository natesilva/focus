## 1. Profile Type and Schema

- [x] 1.1 Add `files?: string[]` to the `Profile` interface in `src/profiles/types.ts`
- [x] 1.2 Add `files: z.array(z.string()).default([])` to `CustomProfileSchema` in `src/profiles/custom.ts` and pass it through to the returned `Profile`

## 2. Built-in Profile Catalog

- [x] 2.1 Add `files: ['~/.claude.json']` to the `claude-code` profile in `src/profiles/catalog.ts`

## 3. Volume Manager — resolveFileMounts

- [x] 3.1 Add `resolveFileMounts(profiles: Profile[], xdg: XdgPaths, hostUid: number): Promise<MountDescriptor[]>` to `src/volumes.ts`
- [x] 3.2 In `resolveFileMounts`: validate each path starts with `~/` and throw a descriptive error if not; derive the host path as `join(xdg.focusVolumesDir, profile.name, basename(containerPath))`; expand leading `~/` to `CONTAINER_HOME` for the container path
- [x] 3.3 Ensure the profile-namespaced host subdirectory exists (`mkdir -p`) before creating the file
- [x] 3.4 If the host file does not exist, create it empty and `chown` it to `hostUid`; if it already exists, use it as-is
- [x] 3.5 Push a `{ hostPath, containerPath, readOnly: false }` descriptor for each file

## 4. Wire resolveFileMounts at Launch

- [x] 4.1 Locate where `resolveVolumeMounts` is called in the container launch path and spread the result of `resolveFileMounts(activeProfiles, xdg, hostUid)` into the same mounts array

## 5. Tests

- [x] 5.1 Update `src/volumes.test.ts`: `resolveFileMounts` creates host file when missing; chowns it; uses existing file as-is; derives host path namespaced by profile name; expands `~/` in container path; throws on absolute paths; returns empty array for profiles with no `files`
- [x] 5.2 Update `src/profiles/profiles.test.ts`: `claude-code` profile includes `~/.claude.json` in `files`; custom profile YAML with `files` list parses correctly; custom profile without `files` defaults to `[]`
