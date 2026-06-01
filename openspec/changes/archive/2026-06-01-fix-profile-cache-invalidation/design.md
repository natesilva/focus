## Context

`focus` caches built images by tagging them with a hash derived from the profile names and base image. When a container is already running, it checks a `focus.config-hash` label (computed by `configHash`) to decide whether to attach or rebuild.

Both hashing functions use profile *names* as the sole representative of profile content. This works for built-in profiles (their content is frozen in code) but breaks for custom profiles in `~/.config/focus/profiles/`: editing a profile's `install` steps leaves the hash unchanged, so stale images and containers are silently reused.

A secondary gap: `configHash` excludes `network`, so switching `network: bridge → none` does not flag a running container as stale.

## Goals / Non-Goals

**Goals:**
- Content changes to any profile (built-in or custom) invalidate the image tag and running-container hash.
- `network` changes invalidate the running-container hash.
- Hash input is normalized structured data so YAML reformatting (comments, whitespace) does not cause spurious rebuilds.
- Profiles are loaded only once per `runContainer` call (no redundant I/O).

**Non-Goals:**
- Changing the hash format for `containerName` (directory-keyed container identity).
- Including `runtime` in `configHash` (it selects the backend, not what the container does or contains).
- Optimizing away the profile reload inside `buildMounts` (separate concern).

## Decisions

### Hash profile content, not profile names

**Decision**: `computeTag` and `configHash` both hash the resolved `Profile[]` structs (specifically `{ name, install }` for the image tag, and `{ name, install, files, volumes }` for the container hash), serialized via `JSON.stringify` over sorted arrays.

**Alternatives considered**:
- *Hash the raw YAML file bytes*: Simpler to implement, but YAML comments and whitespace changes would cause spurious image rebuilds. Rejected.
- *Keep name-only hashing and add a `--force-rebuild` flag*: Gives users an escape hatch but doesn't fix automatic detection. Rejected.
- *Hash only custom profile content, skip built-ins*: Avoids any change to built-in behavior, but future-features.md notes a plan to externalize built-ins to YAML. Treating all profiles uniformly keeps the code simple and correct when that happens. Rejected.

### Move profile loading upstream in `buildImage`

**Decision**: `buildImage` accepts `Profile[]` instead of `(string[], configDir)`. The caller resolves profiles and passes them in.

Previously, `buildImage` loaded profiles lazily (only if the image was absent). With content-based hashing, profiles must be loaded *before* the tag is computed, so the optimization is no longer applicable anyway.

Pushing loading to the caller also means `runContainer` can share the loaded profiles between `configHash` and `buildImage` — one disk read instead of two.

### Include `network` in `configHash`

**Decision**: Add `network` to the `configHash` input alongside `image` and profile content.

`network` is a container-start option (`--network none`), not an image-build option. Changing it requires stopping and restarting the container but not rebuilding the image. Including it in `configHash` ensures `resolveRunAction` detects the change and triggers a rebuild/restart cycle.

`runtime` remains excluded: it determines which adapter processes the start command, not what the container does. A container started by Docker and one started by Apple Containers with identical config are behaviorally equivalent.

## Risks / Trade-offs

**One-time forced rebuild of all existing containers** → On first run after the upgrade, every running container will have a hash mismatch (old algorithm vs. new). Users will see the "config changed" prompt or auto-rebuild message. This is the *desired* behavior (their containers may have been built with stale profile content), but it will surprise users who haven't changed anything. Acceptable given the correctness gain.

**Profile load added to `containerStatus` path** → `containerStatus` previously did zero I/O beyond the container inspect. It now reads the profiles directory when the container is running. For typical setups (a handful of YAML files) this is negligible, but it's a new I/O dependency. Mitigation: the early-return for non-running containers avoids the load entirely in the common idle case.

## Migration Plan

No data migration. The change is purely algorithmic: new tags, new hashes. Existing images with old tags remain on disk but become unreferenced; they can be cleaned up with `docker image prune` as usual.

No rollback strategy needed — reverting the code restores old hashing behavior.

## Open Questions

None.
