## Why

Both `computeTag` (image cache key) and `configHash` (running-container staleness check) hash profile *names* only. When a custom profile's install steps are edited, the hashes are unchanged, so the old image and running container are silently reused with outdated content. Additionally, `configHash` omits `network`, so changing `network: bridge → none` does not trigger a container restart.

## What Changes

- `computeTag` accepts `Profile[]` instead of `string[]` and includes normalized install content (`{ name, install }`) in the hash.
- `buildImage` accepts `Profile[]` from the caller; profile loading moves upstream so the tag is content-based before the image-existence check.
- `configHash` accepts `Profile[]` and includes `{ name, install, files, volumes }` per profile, plus `image` and `network`. `runtime` remains excluded (it selects the backend, not the container's behavior).
- `runContainer` loads profiles once upfront and passes them to both `configHash` and `buildImage`.
- `containerStatus` loads profiles before computing the hash so `configCurrent` stays accurate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-builder`: `computeTag` now hashes profile install content, not just profile names.
- `container-identity`: `configHash` now hashes profile install/files/volumes content and includes `network`.

## Impact

- **`src/image-builder.ts`**: `computeTag` and `buildImage` signature changes (profile names → Profile objects).
- **`src/container.ts`**: `configHash` signature change; `runContainer` and `containerStatus` load profiles upfront.
- **Existing running containers**: All will be detected as stale on next use (hash algorithm changed). They will be rebuilt once, then stable.
- **Tests**: `image-builder.test.ts` and `container.test.ts` updated to pass `Profile[]`; new cases cover install-content-change invalidation and network-change invalidation.
