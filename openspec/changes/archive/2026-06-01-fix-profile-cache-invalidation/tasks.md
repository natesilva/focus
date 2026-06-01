## 1. Update image-builder

- [x] 1.1 Change `computeTag` to accept `Profile[]` instead of `string[]`; hash `JSON.stringify({ baseImage, profiles: sorted.map(p => ({ name: p.name, install: p.install })) })`
- [x] 1.2 Change `buildImage` to accept `Profile[]` instead of `(string[], configDir)`; remove internal `resolveProfiles` call; compute tag from passed profiles
- [x] 1.3 Remove unused `resolveProfiles` import from `image-builder.ts`

## 2. Update container

- [x] 2.1 Import `Profile` type into `container.ts`
- [x] 2.2 Change `configHash` to accept `(config: FocusConfig, profiles: Profile[])`; hash `JSON.stringify({ image, network, profiles: sorted.map(p => ({ name, install, files, volumes })) })`
- [x] 2.3 In `runContainer`: load profiles upfront with `resolveProfiles`, pass to both `configHash` and `buildImage`; remove `configDir` arg from `buildImage` call
- [x] 2.4 In `containerStatus`: load profiles before computing hash; pass to `configHash`

## 3. Update tests

- [x] 3.1 In `image-builder.test.ts`: define shared `Profile` fixtures; update all `computeTag` tests to pass `Profile[]`
- [x] 3.2 In `image-builder.test.ts`: add test case asserting changed install steps produce a different tag
- [x] 3.3 In `container.test.ts`: define `Profile` fixtures; update all `configHash` tests to pass profiles
- [x] 3.4 In `container.test.ts`: split `'runtime and network fields do not affect hash'` into two tests — runtime unchanged, network now asserts inequality
- [x] 3.5 In `container.test.ts`: add test case asserting changed profile install steps produce a different hash
