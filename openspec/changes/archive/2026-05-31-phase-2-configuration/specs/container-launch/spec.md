# Container Launch (delta)

## MODIFIED Requirements

### Requirement: Current directory mounted at /focus
The container SHALL have the current working directory bind-mounted at `/focus` inside the container.

#### Scenario: Mount present at launch
- **WHEN** a container is launched for a given working directory
- **THEN** the host directory is accessible inside the container at `/focus`

### Requirement: Container image is config-driven
The container image SHALL be taken from `FocusConfig.image` rather than a hard-coded constant.

#### Scenario: Default image
- **WHEN** no image is specified in global or project config
- **THEN** the container is launched using `ubuntu:24.04`

#### Scenario: Custom image from project config
- **WHEN** `.focus.yaml` specifies `image: debian:bookworm-slim`
- **THEN** the container is launched using `debian:bookworm-slim`

### Requirement: Network mode is config-driven
The container network mode SHALL be taken from `FocusConfig.network`.

#### Scenario: Default network (bridge)
- **WHEN** no network is specified in config
- **THEN** the container is launched with the default bridge network (no explicit `--network` flag)

#### Scenario: Air-gapped network
- **WHEN** `FocusConfig.network` is `"none"`
- **THEN** the container is launched with `--network none`
