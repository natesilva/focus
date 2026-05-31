## 1. Dependencies

- [x] 1.1 Add `zod` (v4) to `package.json` and install

## 2. XDG Path Resolution

- [x] 2.1 Create `src/config/xdg.ts` with `xdgPaths()` function returning `configHome`, `dataHome`, `cacheHome`, `stateHome`, and the four focus-specific subdirectory paths
- [x] 2.2 Verify XDG env var overrides work correctly (unit test or manual smoke test)

## 3. Global Config

- [x] 3.1 Create `src/config/global.ts` with Zod schema for global config (`runtime`, `tools`, `image`) and a `loadGlobalConfig()` function
- [x] 3.2 Verify missing file returns defaults; invalid file throws

## 4. Project Config

- [x] 4.1 Create `src/config/project.ts` with Zod schema for project config (`runtime`, `tools`, `image`, `network`) and a `loadProjectConfig(dir)` function
- [x] 4.2 Verify missing file returns `null`; invalid file throws; unknown fields throw (strict mode)

## 5. Config Resolver

- [x] 5.1 Define the `FocusConfig` type (fully resolved, no optional fields) in `src/config/resolver.ts`
- [x] 5.2 Implement `resolveConfig(projectDir, flags?)` that merges global → project → flags and returns `FocusConfig`
- [x] 5.3 Verify merge precedence: global < project < flags

## 6. Container Launch Updates

- [x] 6.1 Update `StartOptions` in `src/runtime/docker.ts` to include `network?: "none"` field
- [x] 6.2 Update `docker.start()` to pass `--network none` when `network` is `"none"`
- [x] 6.3 Update `src/container.ts` to accept `FocusConfig` and use `config.image` instead of the hard-coded `IMAGE` constant; pass `network` through to the runtime adapter

## 7. CLI Entrypoint Updates

- [x] 7.1 Update `src/cli.ts` to call `resolveConfig(cwd)` before any container operation and pass the result to `runContainer`
- [x] 7.2 Add `init` subcommand dispatch to `src/cli.ts`

## 8. Focus Init Command

- [x] 8.1 Create `src/commands/init.ts` implementing `focusInit(cwd)`: write scaffolded `.focus.yaml` with commented-out fields, refuse to overwrite, print confirmation
- [x] 8.2 Verify that the scaffolded file parses cleanly through `loadProjectConfig`

## 9. Type Check

- [x] 9.1 Run `tsc --noEmit` and fix any type errors
