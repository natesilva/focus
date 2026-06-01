## 1. RuntimeAdapter Interface

- [x] 1.1 Create `src/runtime/adapter.ts` exporting `RuntimeAdapter` interface with `start`, `exec`, `inspect`, `stop`, and `listFocusContainers` method signatures matching the Docker module's exports
- [x] 1.2 Export `StartOptions` and `InspectResult` types from `adapter.ts` (move definitions there; re-export from `docker.ts` for backward compatibility)

## 2. DockerRuntimeAdapter

- [x] 2.1 Add `DockerRuntimeAdapter` class to `src/runtime/docker.ts` implementing `RuntimeAdapter` by delegating to the existing exported functions
- [x] 2.2 Verify existing Docker tests still pass with no changes to function signatures

## 3. Apple Containers Backend

- [x] 3.1 Create `src/runtime/apple-containers.ts` with `AppleContainersRuntimeAdapter` class implementing `RuntimeAdapter`
- [x] 3.2 Implement `start()`: build `container run` args with `--interactive [--tty]`, `-e FOCUS_UID=<uid>`, `-v` mounts, labels, and entrypoint; omit `--network` entirely (Apple Containers has no `none` equivalent — `StartOptions.network` is silently ignored by this adapter)
- [x] 3.3 Implement `exec()`: build `container exec --interactive [--tty] --user <uid> --workdir /focus <name> <cmd>` args
- [x] 3.4 Implement `inspect()`: parse `container inspect` JSON output; return `{ running: false, labels: {} }` on failure
- [x] 3.5 Implement `stop()`: run `container stop <name>`; treat "not found" errors as idempotent success
- [x] 3.6 Implement `listFocusContainers()`: run `container list --format json`; parse the array; filter client-side where `configuration.labels['focus.cwd']` exists; return `[{ name: id, cwd: label }]` — no secondary inspect calls needed since labels are included in list output

## 4. Runtime Factory

- [x] 4.1 Create `src/runtime/index.ts` exporting `selectRuntime(runtime: FocusConfig['runtime']): Promise<RuntimeAdapter>`
- [x] 4.2 For `'docker'`: return `new DockerRuntimeAdapter()` immediately
- [x] 4.3 For `'apple-containers'`: return `new AppleContainersRuntimeAdapter()` immediately
- [x] 4.4 For `'auto'`: check `process.platform === 'darwin'`; if true, probe `container --version` via `execFile`; return Apple Containers adapter on success, Docker adapter on failure or non-macOS

## 5. Wire Adapter into container.ts

- [x] 5.1 Update `runContainer` to call `await selectRuntime(config.runtime)` and use the returned adapter in place of all direct `docker.*` calls
- [x] 5.2 Update `stopContainer` to call `selectRuntime` and use adapter's `stop` method
- [x] 5.3 Update `containerStatus` to call `selectRuntime` and use adapter's `inspect` method
- [x] 5.4 Update `attachContainer` to accept an adapter parameter and use adapter's `exec` method
- [x] 5.5 Update `pruneOrphanedContainers` (private) to use adapter's `listFocusContainers` and `stop`

## 6. Tests

- [x] 6.1 Add unit tests for `selectRuntime`: verify `'docker'` returns `DockerRuntimeAdapter`, `'apple-containers'` returns `AppleContainersRuntimeAdapter`, `'auto'` on non-darwin returns `DockerRuntimeAdapter`
- [x] 6.2 Add unit tests for `AppleContainersRuntimeAdapter`: test `buildExecArgs`-equivalent helpers for correct flag construction (no live `container` CLI needed)
- [x] 6.3 Update `container.test.ts` to inject a mock `RuntimeAdapter` instead of mocking the `docker` module directly, validating adapter dispatch logic
- [x] 6.4 Run `tsc --noEmit` to confirm no type errors across all new and modified files
