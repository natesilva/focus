# Container Identity

## Purpose

Defines how containers are identified by name and config hash, and how the system determines whether to attach to a running container or launch a new one.

## Requirements

### Requirement: Container name derived from working directory
A container's name SHALL be deterministically derived from the absolute path of the working directory using a SHA-256 hash prefix (first 8 hex characters), producing the form `focus-<hash>`.

#### Scenario: Same directory yields same name
- **WHEN** `containerName` is called twice with the same absolute path
- **THEN** both calls return the same string

#### Scenario: Different directories yield different names
- **WHEN** `containerName` is called with two distinct absolute paths
- **THEN** the returned strings differ

### Requirement: Config hash covers profile content, base image, and network
A config hash SHALL be computed as the SHA-256 (first 16 hex characters) of the JSON-serialized object `{ image: <base image string>, network: <network mode>, profiles: [{ name, install, files, volumes }, ...] }` where profiles are sorted alphabetically by name. The `runtime` field SHALL be excluded from the hash. This hash identifies the full behavioral configuration of a container.

#### Scenario: Identical config produces identical hash
- **WHEN** `configHash` is called twice with the same profiles, image, and network
- **THEN** both calls return the same string

#### Scenario: Different profile sets produce different hashes
- **WHEN** `configHash` is called with profiles `[git]` vs `[git, ripgrep]`
- **THEN** the returned strings differ

#### Scenario: Different base images produce different hashes
- **WHEN** `configHash` is called with two configs that differ only in their `image` field
- **THEN** the returned strings differ

#### Scenario: Profile order does not affect hash
- **WHEN** `configHash` is called with `[node, git]` and again with `[git, node]`
- **THEN** both calls return the same string

#### Scenario: Changed profile install steps produce different hash
- **WHEN** `configHash` is called with a profile whose `install` array has been modified
- **THEN** the hash differs from a call with the original profile

#### Scenario: Changed network mode produces different hash
- **WHEN** `configHash` is called with `network: 'bridge'` and again with `network: 'none'`
- **THEN** the returned strings differ

#### Scenario: Different runtime does not affect hash
- **WHEN** `configHash` is called with `runtime: 'docker'` and again with `runtime: 'apple-containers'`
- **THEN** both calls return the same string

### Requirement: Running container identity readable via Docker labels
When a focus container is started, its working directory and config hash SHALL be stored as Docker labels (`focus.cwd` and `focus.config-hash`) so they can be retrieved later without a separate registry file.

#### Scenario: Labels attached at launch
- **WHEN** a container is launched by the Docker runtime adapter
- **THEN** the container has label `focus.cwd` equal to the absolute working directory path and label `focus.config-hash` equal to the config hash

#### Scenario: Labels retrievable via inspect
- **WHEN** `docker inspect` is called on a running focus container
- **THEN** the `focus.cwd` and `focus.config-hash` labels are present and match the values at launch time

### Requirement: Identity checked before launching a new container
Before launching a container, the system SHALL inspect any container matching the computed name. If one is running, its stored config hash SHALL be compared to the current config hash to determine whether to attach or rebuild.

#### Scenario: Running container with matching hash
- **WHEN** a container named `focus-<hash>` is already running with the same config hash
- **THEN** the system attaches to it rather than launching a new container

#### Scenario: Running container with mismatched hash
- **WHEN** a container named `focus-<hash>` is already running with a different config hash
- **THEN** the system detects the mismatch and proceeds to the rebuild flow

#### Scenario: No running container
- **WHEN** no container named `focus-<hash>` is running
- **THEN** the system proceeds to launch a new container
