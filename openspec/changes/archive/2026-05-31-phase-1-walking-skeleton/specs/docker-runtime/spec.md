## ADDED Requirements

### Requirement: Start container
The Docker runtime adapter SHALL start a new container given a container name, image, mount spec, and user configuration.

#### Scenario: Interactive start
- **WHEN** the adapter is asked to start a container in interactive mode
- **THEN** it runs `docker run` with `-it` (or `-i` in non-TTY contexts), the given name, the bind mount, and the user entry point, then attaches stdin/stdout/stderr

#### Scenario: Non-interactive command execution
- **WHEN** the adapter is asked to run a specific command non-interactively
- **THEN** it runs `docker run` without TTY allocation, captures output, and returns the process exit code

### Requirement: Stop container
The Docker runtime adapter SHALL stop a running container by name.

#### Scenario: Container exists and is running
- **WHEN** the adapter is asked to stop a container that is running
- **THEN** it runs `docker stop <name>` and resolves successfully

#### Scenario: Container does not exist
- **WHEN** the adapter is asked to stop a container that does not exist
- **THEN** it resolves successfully without error (idempotent)

### Requirement: Inspect container status
The Docker runtime adapter SHALL determine whether a named container is currently running.

#### Scenario: Container is running
- **WHEN** the adapter checks status for a container name that is running
- **THEN** it returns `{ running: true }`

#### Scenario: Container is stopped or absent
- **WHEN** the adapter checks status for a container name that is not running
- **THEN** it returns `{ running: false }`

### Requirement: TTY-aware flag selection
The Docker runtime adapter SHALL detect whether the current process has an allocated TTY and select `docker run` flags accordingly.

#### Scenario: TTY present
- **WHEN** `process.stdin.isTTY` is truthy at start time
- **THEN** the adapter passes `-it` to `docker run`

#### Scenario: No TTY
- **WHEN** `process.stdin.isTTY` is falsy at start time
- **THEN** the adapter passes `-i` (no `-t`) to `docker run`
