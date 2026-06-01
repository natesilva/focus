# Image Builder

## Purpose

Defines how container images are built from a list of tool profiles and a base image string, including Dockerfile generation, content-addressed tagging, and caching behavior.

## Requirements

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

### Requirement: Generated Dockerfile structure
The image builder SHALL generate a Dockerfile of the form: a `FROM` line for the base image followed by one `RUN` layer per profile in alphabetical order.

#### Scenario: Profile install commands appear in correct order
- **WHEN** profiles `["node", "git"]` are requested
- **THEN** the generated Dockerfile lists the `git` profile's `RUN` block before `node` (alphabetical order)

#### Scenario: Each profile produces its own RUN layer
- **WHEN** two profiles are resolved
- **THEN** the Dockerfile contains exactly two `RUN` instructions (one per profile)

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

### Requirement: Cache hit skips rebuild
If a Docker image with the computed tag already exists locally, the image builder SHALL skip `docker build` and return the existing tag immediately.

#### Scenario: Cache hit returns quickly
- **WHEN** `buildImage` is called and a Docker image tagged `focus-built:<hash>` already exists locally
- **THEN** `docker build` is NOT invoked and the tag is returned

#### Scenario: Cache miss triggers build
- **WHEN** `buildImage` is called and no image with the computed tag exists locally
- **THEN** `docker build` is invoked and the resulting image is tagged `focus-built:<hash>`

### Requirement: Build output streamed to stderr
During `docker build`, the image builder SHALL stream Docker's build output to the process's stderr so the user can observe progress.

#### Scenario: Build output visible
- **WHEN** a cache miss triggers `docker build`
- **THEN** build log lines appear on stderr in real time

### Requirement: Empty tool list bypasses builder
When the resolved tool list is empty, the image builder SHALL return the base image string unchanged without invoking `docker build`.

#### Scenario: Empty tools list returns base image
- **WHEN** `buildImage([], "ubuntu:24.04")` is called
- **THEN** the string `"ubuntu:24.04"` is returned and no Docker command is executed
