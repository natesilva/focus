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

### Requirement: Exit code propagation
When `focus -- <cmd>` is used, the exit code of the container process SHALL be propagated as the exit code of the `focus` process.

#### Scenario: Command succeeds
- **WHEN** the command inside the container exits with code 0
- **THEN** `focus` exits with code 0

#### Scenario: Command fails
- **WHEN** the command inside the container exits with a non-zero code
- **THEN** `focus` exits with the same non-zero code
