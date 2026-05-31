## ADDED Requirements

### Requirement: Build image from profile list
The image builder SHALL accept a list of profile names and a base image string, resolve each profile from the catalog, generate a Dockerfile, and produce a built Docker image identified by a stable tag.

#### Scenario: Single profile build succeeds
- **WHEN** `buildImage(["ripgrep"], "ubuntu:24.04")` is called
- **THEN** a Docker image exists tagged as `focus-built:<hash>` after the call returns

#### Scenario: Multiple profiles combined into one image
- **WHEN** `buildImage(["git", "ripgrep"], "ubuntu:24.04")` is called
- **THEN** the generated Dockerfile contains a `RUN` block for each profile and a single image is produced

#### Scenario: Unknown profile name propagates error
- **WHEN** `buildImage(["nonexistent"], "ubuntu:24.04")` is called
- **THEN** the system throws an error before invoking `docker build`

### Requirement: Generated Dockerfile structure
The image builder SHALL generate a Dockerfile of the form: a `FROM` line for the base image followed by one `RUN` layer per profile in alphabetical order.

#### Scenario: Profile install commands appear in correct order
- **WHEN** profiles `["node", "git"]` are requested
- **THEN** the generated Dockerfile lists the `git` profile's `RUN` block before `node` (alphabetical order)

#### Scenario: Each profile produces its own RUN layer
- **WHEN** two profiles are resolved
- **THEN** the Dockerfile contains exactly two `RUN` instructions (one per profile)

### Requirement: Content-addressed image tag
The image tag SHALL be `focus-built:<hash>` where `<hash>` is the first 12 hex characters of the SHA-256 digest of the base image string and the sorted profile names joined by newlines.

#### Scenario: Same inputs produce same tag
- **WHEN** `buildImage` is called twice with identical profile lists and base image
- **THEN** both calls produce the same `focus-built:<hash>` tag

#### Scenario: Different base image produces different tag
- **WHEN** `buildImage(["git"], "ubuntu:24.04")` and `buildImage(["git"], "debian:bookworm-slim")` are called
- **THEN** the two calls produce different tags

#### Scenario: Different profile list produces different tag
- **WHEN** `buildImage(["git"], "ubuntu:24.04")` and `buildImage(["git", "ripgrep"], "ubuntu:24.04")` are called
- **THEN** the two calls produce different tags

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
