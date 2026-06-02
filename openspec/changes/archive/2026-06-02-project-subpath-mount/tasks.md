## 1. Runtime Adapter Interface

- [x] 1.1 Add optional `workdir?: string` parameter to `RuntimeAdapter.exec()` in `src/runtime/adapter.ts`

## 2. Docker Adapter

- [x] 2.1 Update `buildExecArgs()` in `src/runtime/docker.ts` to accept and use an optional `workdir` parameter (default `/focus` for backward compatibility in tests)
- [x] 2.2 Update `start()` in `src/runtime/docker.ts`: replace `-v ${cwd}:/focus` with `-v focus-ws-<hash8>:/focus` followed by `-v ${cwd}:/focus/${basename(cwd)}`, ordering the named volume before the bind-mount
- [x] 2.3 Update `exec()` in `src/runtime/docker.ts` to accept and forward the `workdir` parameter to `buildExecArgs()`

## 3. Apple Containers Adapter

- [x] 3.1 Update `start()` in `src/runtime/apple-containers.ts`: same nested mount change as Docker — named volume at `/focus` then project bind-mount at `/focus/${basename(cwd)}`
- [x] 3.2 Update `exec()` in `src/runtime/apple-containers.ts` to accept and use the optional `workdir` parameter in the `--workdir` flag

## 4. Container Orchestration

- [x] 4.1 Add `workspaceVolumeName(cwd: string): string` helper to `src/container.ts` (returns `focus-ws-<hash8>` using the same hash as `containerName`)
- [x] 4.2 Update `configHash()` in `src/container.ts` to include `layoutVersion: 2` in the serialized data
- [x] 4.3 Update `attachContainer()` in `src/container.ts` to accept `cwd: string` and pass `/focus/${basename(cwd)}` as the `workdir` argument to `adapter.exec()`
- [x] 4.4 Update `runContainer()` in `src/container.ts` to pass `workspaceVolumeName(cwd)` in `StartOptions` and to pass `cwd` to `attachContainer()`

## 5. StartOptions

- [x] 5.1 Add `workspaceVolume: string` field to `StartOptions` in `src/runtime/adapter.ts` so both adapters receive the named volume name

## 6. Entrypoint Script

- [x] 6.1 Change `cd /focus` to `cd "/focus/$FOCUS_PROJECT"` in `src/entrypoint.sh`
- [x] 6.2 Add `git -C "/focus/$FOCUS_PROJECT" worktree prune 2>/dev/null || true` after the `cd` in `src/entrypoint.sh`

## 7. Tests

- [x] 7.1 Update `buildExecArgs` tests in `src/runtime/docker.test.ts` to expect `/focus/<dirname>` as the workdir
- [x] 7.2 Add tests for `workspaceVolumeName()` in `src/container.test.ts`
- [x] 7.3 Verify existing `container.test.ts` config hash tests still pass (or update expected hashes for the new layout version)
