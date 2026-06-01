## MODIFIED Requirements

### Requirement: Content-addressed image tag
The image tag SHALL be `focus-built:<hash>` where `<hash>` is the first 12 hex characters of the SHA-256 digest of the JSON-serialized object `{ baseImage: <base image string>, profiles: [{ name, install }, ...] }` where profiles are sorted alphabetically by name.

#### Scenario: Same inputs produce same tag
- **WHEN** `buildImage` is called twice with identical profiles and base image
- **THEN** both calls produce the same `focus-built:<hash>` tag

#### Scenario: Different base image produces different tag
- **WHEN** `buildImage(profiles, "ubuntu:24.04")` and `buildImage(profiles, "debian:bookworm-slim")` are called
- **THEN** the two calls produce different tags

#### Scenario: Different profile list produces different tag
- **WHEN** `buildImage` is called with `[git]` vs `[git, ripgrep]`
- **THEN** the two calls produce different tags

#### Scenario: Changed profile install steps produce different tag
- **WHEN** `buildImage` is called with a profile whose `install` array is modified
- **THEN** the resulting tag differs from a call with the original install steps

#### Scenario: Profile input order does not affect tag
- **WHEN** `buildImage` is called with `[ripgrep, git]` and again with `[git, ripgrep]`
- **THEN** both calls produce the same tag

### Requirement: Build image from profile list
The image builder SHALL accept a list of resolved `Profile` objects and a base image string, generate a Dockerfile, and produce a built Docker image identified by a stable content-addressed tag. Profile resolution (from names to Profile objects) is the caller's responsibility.

#### Scenario: Single profile build succeeds
- **WHEN** `buildImage([ripgrepProfile], "ubuntu:24.04")` is called
- **THEN** a Docker image exists tagged as `focus-built:<hash>` after the call returns

#### Scenario: Multiple profiles combined into one image
- **WHEN** `buildImage([gitProfile, ripgrepProfile], "ubuntu:24.04")` is called
- **THEN** the generated Dockerfile contains a `RUN` block for each profile and a single image is produced

#### Scenario: Unknown profile name propagates error
- **WHEN** the caller attempts to resolve a non-existent profile name before calling `buildImage`
- **THEN** the system throws an error before `buildImage` is invoked
