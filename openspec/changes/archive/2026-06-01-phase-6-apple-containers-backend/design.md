## Context

`focus` has a working Docker backend exercised through five phases. The design always called for a `RuntimeAdapter` abstraction, but none was extracted during the Docker-only phases — the right call at the time. Now that the Docker backend is fully exercised, the adapter interface shape is well-understood and can be formalized before adding the Apple Containers implementation.

The Apple Containers backend uses the `container` CLI — an independently distributed tool (not bundled with macOS) that users install and upgrade themselves, e.g. `brew install container`. It is command-driven, like Docker, so the abstraction layer maps cleanly. The primary differences are the JSON output schema from `inspect`/`list`, the absence of a label filter flag on `container list`, and the fact that the image builder currently calls `docker` directly.

## Goals / Non-Goals

**Goals:**
- Formalize a `RuntimeAdapter` interface with seven operations: `start`, `exec`, `inspect`, `stop`, `listFocusContainers`, `imageExists`, `buildImage`
- Wrap the Docker module as `DockerRuntimeAdapter` with zero behavior change
- Implement `AppleContainersRuntimeAdapter` using the `container` CLI
- Add a `selectRuntime(config, cwd)` factory that resolves `auto` → concrete adapter
- Wire the adapter through `container.ts` and `image-builder.ts` so all paths use it

**Non-Goals:**
- Changing how volumes, config, or entrypoints work
- Supporting Podman as a separate adapter (it uses Docker context integration)
- GUI, TUI, or daemon-mode container management
- Windows support
- Native SSH agent forwarding via `--ssh` (deferred; see `docs/future-features.md`)

## Decisions

### Decision: Interface shape mirrors existing Docker module exports

The Docker module already exports `start`, `exec`, `inspect`, `stop`, and `listFocusContainers` with typed signatures. The `RuntimeAdapter` interface is defined as these five methods with identical signatures. This means `DockerRuntimeAdapter` is a thin wrapper with no logic changes, and the risk of regression is minimal.

Alternative considered: a higher-level interface (e.g. `run(opts)` combining start/attach). Rejected because it would require refactoring `container.ts` logic rather than just swapping the backend.

### Decision: Apple Containers adapter passes UID via environment variable on `container run`, not `--user`

`container run` supports `--user`, but focus cannot use it directly: the entrypoint script must run as root first to call `useradd` and `chown` the home directory before dropping to the non-root user. Passing `--user <uid>` would bypass that setup. The entrypoint script already uses `$FOCUS_UID` (set via `-e FOCUS_UID=<uid>`) to perform user creation and then exec into the non-root user. This approach works identically for both backends.

### Decision: `auto` detection probes the `container` binary at runtime

`selectRuntime('auto')` runs `container --version` (captured, not inherited). If it exits 0, Apple Containers is available and preferred on macOS. If the probe fails or the platform is not macOS, Docker is used. The probe result is not cached between invocations — focus is a short-lived CLI, so there is no perf benefit to caching.

Alternative considered: check macOS version number. Rejected because `container` is not bundled with macOS — the binary must be installed separately — so its presence is the only reliable capability signal.

### Decision: `container exec` for attach uses `--user` flag

Both `container exec` and `docker exec` support `--user <uid>`. For attach (exec into an already-running container), the user account already exists from the initial entrypoint run, so `--user <uid>` is correct and sufficient. This is consistent with the Docker exec path.

Alternative considered: omit `--user` on exec and rely on the entrypoint's user creation having already run. Rejected for clarity — explicitly passing `--user` makes the exec invocation self-documenting and avoids relying on exec inheriting the parent process's user.

### Decision: Volume mount syntax

Apple Containers uses `-v <host>:<container>` syntax on `container run`, identical to Docker. The `:ro` suffix for read-only mounts is also supported. No changes needed to `buildVolumeFlags`.

### Decision: `listFocusContainers` fetches all containers and filters client-side

The `container list` CLI has no `--filter` flag. Unlike Docker's `docker ps --filter label=focus.cwd`, focus runs `container list --format json` (running containers only — `--all` is intentionally omitted since `pruneOrphanedContainers` only needs to stop *running* containers) and filters the parsed JSON array by `configuration.labels["focus.cwd"]` presence. This is slightly less efficient but correct.

The `container inspect` JSON structure also differs from Docker's: the running state is `status == "running"` (a string field), and labels live at `configuration.labels` (a `[String: String]` dict), not at `Config.Labels`. The Apple Containers adapter's `parseInspectOutput` equivalent reflects these paths.

### Decision: Image build operations belong on `RuntimeAdapter`

`image-builder.ts` currently calls `docker image inspect` and `docker build` directly. These operations must be abstracted for the same reason as `container run`: an Apple Containers user may have no `docker` binary. Two new methods — `imageExists(tag): Promise<boolean>` and `buildImage(tag, dockerfile): Promise<void>` — are added to `RuntimeAdapter`. Both backends support standard Dockerfiles. `DockerRuntimeAdapter.buildImage` pipes the Dockerfile to `docker build -t tag -` via stdin. `AppleContainersRuntimeAdapter.buildImage` writes the Dockerfile to a `mkdtemp` directory and passes that as the context to `container build -t tag <dir>`, then cleans up — `container build` requires a real context directory and does not support reading from stdin. `buildImage` in `image-builder.ts` is updated to accept an adapter and delegate through it.

## Risks / Trade-offs

- **`container` is independently versioned and evolves quickly**: Users install and upgrade it themselves; flag names or output schemas can change between their local version and what the adapter was written against. Mitigation: flag errors surface immediately on first use, and Phase 7 integration testing pins against a known version.
- **`auto` probe adds ~50ms to startup on macOS when Apple Containers is not installed**: Acceptable for a CLI tool. The probe is a fast `execFile` call.
- **No real hardware to test Apple Containers at dev time**: The adapter is written to match the documented `container` CLI spec and the structural pattern of the Docker adapter. Integration validation is deferred to Phase 7.

## Migration Plan

No data migration. The change is purely additive:

1. Add `src/runtime/adapter.ts` (interface, including `imageExists`/`buildImage`)
2. Add `src/runtime/apple-containers.ts` (implementation)
3. Add `src/runtime/index.ts` (factory)
4. Update `src/runtime/docker.ts` to export `DockerRuntimeAdapter` class
5. Update `src/container.ts` to call `selectRuntime(config)` and use the adapter
6. Update `src/image-builder.ts` to accept a `RuntimeAdapter` and delegate image operations through it

Existing Docker users see no behavior change. The `DockerRuntimeAdapter` wraps the same functions that were called directly before. Rollback: revert `container.ts` and `image-builder.ts` to call Docker functions directly.
