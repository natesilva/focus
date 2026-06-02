## MODIFIED Requirements

### Requirement: Generated Dockerfile structure
The image builder SHALL generate a Dockerfile of the form: a `FROM` line for the base image followed by one `RUN` layer per profile in the order the profiles are provided. The caller is responsible for providing profiles in the correct install order (e.g., topological order from `resolveProfiles`).

#### Scenario: Profile install commands appear in input order
- **WHEN** `generateDockerfile([nodeProfile, claudeCodeProfile], baseImage)` is called
- **THEN** the generated Dockerfile lists the `node` profile's `RUN` block before `claude-code`'s

#### Scenario: Each profile produces its own RUN layer
- **WHEN** two profiles are provided
- **THEN** the Dockerfile contains exactly two `RUN` instructions (one per profile)
