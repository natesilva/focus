## Why

`focus` currently hard-codes the Docker runtime throughout `container.ts` and `runtime/docker.ts`, with no abstraction layer despite the design calling for multiple backends. Phase 6 extracts a formal `RuntimeAdapter` interface from the Docker backend's proven shape and implements the Apple Containers backend, enabling macOS users to run `focus` with no Docker dependency.

## What Changes

- Extract a `RuntimeAdapter` interface from the existing Docker backend functions (`start`, `exec`, `inspect`, `stop`, `listFocusContainers`) and extend it with image-build operations (`imageExists`, `buildImage`) so the image builder is no longer Docker-specific
- Wrap the Docker module as a `DockerRuntimeAdapter` implementing that interface
- Implement `AppleContainersRuntimeAdapter` using the native `container` CLI (macOS 26+)
- Add `auto` detection logic: prefer Apple Containers on macOS when the `container` CLI is available, fall back to Docker
- Wire the resolved runtime from `FocusConfig.runtime` through `container.ts` and `image-builder.ts` so all container and build operations use the selected adapter
- Validate volume mounting and UID handling under Apple Containers

## Capabilities

### New Capabilities

- `runtime-adapter`: The formal `RuntimeAdapter` interface (including image-build operations) and factory/detection logic that selects the active backend at runtime
- `apple-containers-runtime`: Apple Containers backend implementing `RuntimeAdapter` via the `container` CLI

### Modified Capabilities

- `container-launch`: `runContainer`, `stopContainer`, `containerStatus`, and `attachContainer` now accept/resolve a `RuntimeAdapter` instead of calling the Docker module directly; behavior is otherwise identical
- `docker-runtime`: The Docker module functions are wrapped into a `DockerRuntimeAdapter` class; the low-level functions remain exported for testing
- `image-builder`: `buildImage` now accepts a `RuntimeAdapter` and delegates `imageExists`/`buildImage` calls to it instead of hard-coding Docker CLI invocations

## Impact

- `src/runtime/docker.ts` — wrapped but not rewritten; exports unchanged for test compatibility
- `src/container.ts` — adapter injected; no behavior change for Docker users
- `src/image-builder.ts` — accepts a `RuntimeAdapter`; behavior identical for Docker users
- New files: `src/runtime/adapter.ts`, `src/runtime/apple-containers.ts`, `src/runtime/index.ts` (factory)
- `src/config/resolver.ts` / `FocusConfig` — no schema change; `runtime` field already exists
- No new npm dependencies; Apple Containers backend uses the `container` CLI exactly as Docker backend uses `docker`
