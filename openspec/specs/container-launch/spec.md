# Container Launch

## Purpose

Defines the behavior for launching containers, including directory mounting, user identity, naming, and exit code handling.

## Requirements

### Requirement: Current directory mounted at /focus
The container SHALL have the current working directory bind-mounted at `/focus` inside the container.

#### Scenario: Mount present at launch
- **WHEN** a container is launched for a given working directory
- **THEN** the host directory is accessible inside the container at `/focus`

### Requirement: Non-root user with matching host UID
The container SHALL run as a non-root user whose numeric UID matches the host user's UID.

#### Scenario: User created at container start
- **WHEN** a container is launched
- **THEN** a user with the host UID exists inside the container, and the container process runs as that user

#### Scenario: Root user avoided
- **WHEN** a container is launched
- **THEN** `whoami` inside the container does not return `root`

### Requirement: Stable container name derived from working directory
A container's name SHALL be deterministically derived from the absolute path of the working directory so that `stop` and `status` can locate it without stored state.

#### Scenario: Same directory yields same name
- **WHEN** `focus` is invoked twice in the same directory
- **THEN** both invocations compute the same container name

#### Scenario: Different directories yield different names
- **WHEN** `focus` is invoked in two different directories
- **THEN** the computed container names differ

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

### Requirement: Persistent volume mounts included at launch
The container launch invocation SHALL include bind-mount arguments for all resolved volume mounts returned by the volume manager, in addition to the `/focus` project mount.

#### Scenario: Volume mounts passed to runtime
- **WHEN** a container is launched and the volume manager returns one or more mount descriptors
- **THEN** each descriptor is translated to a bind-mount argument (e.g. `-v <hostPath>:<containerPath>[:ro]`) in the runtime invocation

#### Scenario: Read-only flag honored
- **WHEN** a mount descriptor has `readOnly: true`
- **THEN** the bind-mount argument includes the `:ro` modifier

#### Scenario: No volumes when all slots are empty
- **WHEN** the volume manager returns an empty mount list (e.g. no `~/.gitconfig` and volumes dir missing)
- **THEN** no extra `-v` arguments are added and the container launches successfully with only `/focus` mounted

### Requirement: Exit code propagation
When `focus -- <cmd>` is used, the exit code of the container process SHALL be propagated as the exit code of the `focus` process.

#### Scenario: Command succeeds
- **WHEN** the command inside the container exits with code 0
- **THEN** `focus` exits with code 0

#### Scenario: Command fails
- **WHEN** the command inside the container exits with a non-zero code
- **THEN** `focus` exits with the same non-zero code
