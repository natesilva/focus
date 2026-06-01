## MODIFIED Requirements

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
