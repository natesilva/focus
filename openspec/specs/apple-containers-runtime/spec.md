# Apple Containers Runtime

## Purpose

Defines the behavior of the Apple Containers runtime adapter, which wraps the `container` CLI to start, exec into, inspect, stop, and list containers on macOS using the native Apple Containers framework.

## Requirements

### Requirement: Start container via Apple Containers
The Apple Containers runtime adapter SHALL start a new container by invoking the `container run` CLI command with the given name, image, mount spec, and environment, using the same `StartOptions` as the Docker adapter.

#### Scenario: Interactive start
- **WHEN** the adapter is asked to start a container in interactive mode (no command specified)
- **THEN** it runs `container run` with `--interactive --tty` (or `--interactive` in non-TTY contexts), the given name and image, bind mounts, and the entrypoint script

#### Scenario: Non-interactive command execution
- **WHEN** the adapter is asked to run a specific command non-interactively
- **THEN** it runs `container run` without TTY allocation, passes the command, and returns the process exit code

#### Scenario: UID passed via environment variable
- **WHEN** a container is started
- **THEN** `FOCUS_UID=<uid>` is passed as an environment variable (via `-e`); the entrypoint script runs as root, uses this value to create the user account and chown the home directory, then execs as the non-root user — `--user` is not passed to `container run` because the entrypoint must start as root

#### Scenario: Volume mounts included
- **WHEN** the adapter starts a container with one or more mount descriptors
- **THEN** each mount is passed as `-v <hostPath>:<containerPath>[:ro]` to `container run`

#### Scenario: Network mode none
- **WHEN** `StartOptions.network` is `'none'`
- **THEN** no `--network` flag is passed; the Apple Containers adapter always uses the default NAT network because the `container` CLI has no equivalent of Docker's `--network none` (its `NetworkMode` enum supports only `nat` and `hostOnly`, neither of which provides full isolation via a `container run` flag)

### Requirement: Attach to running container via Apple Containers
The Apple Containers runtime adapter SHALL attach to a running container using `container exec`.

#### Scenario: Exec with TTY
- **WHEN** the adapter is asked to exec into a container interactively
- **THEN** it runs `container exec --interactive --tty --user <uid> --workdir /work/<dirname> <name> <cmd>`

#### Scenario: Exec without TTY
- **WHEN** the adapter is asked to exec into a container non-interactively
- **THEN** it runs `container exec --interactive --user <uid> --workdir /work/<dirname> <name> <cmd>` (no `--tty`)

### Requirement: Inspect container status via Apple Containers
The Apple Containers runtime adapter SHALL determine whether a named container is running and return its labels.

#### Scenario: Container is running
- **WHEN** the adapter inspects a container that is running
- **THEN** it returns `{ running: true, labels: { ... } }` parsed from `container inspect` JSON output

#### Scenario: Container is stopped or absent
- **WHEN** the adapter inspects a container that does not exist or is not running
- **THEN** it returns `{ running: false, labels: {} }`

### Requirement: Stop container via Apple Containers
The Apple Containers runtime adapter SHALL stop a running container by name using `container stop`.

#### Scenario: Container exists and is running
- **WHEN** the adapter is asked to stop a container that is running
- **THEN** it runs `container stop <name>` and resolves successfully

#### Scenario: Container does not exist
- **WHEN** the adapter is asked to stop a container that does not exist
- **THEN** it resolves successfully without error (idempotent)

### Requirement: List focus containers via Apple Containers
The Apple Containers runtime adapter SHALL list running containers that have the `focus.cwd` label, returning their name and working directory.

The `container list` CLI has no `--filter` flag. Instead, the adapter runs `container list --format json` and filters client-side: the JSON array contains objects with `configuration.labels` and `configuration.id` fields (from `ContainerConfiguration`), so label filtering can be done in code without additional `inspect` calls.

#### Scenario: Running focus containers returned
- **WHEN** one or more containers with the `focus.cwd` label are running
- **THEN** `listFocusContainers` runs `container list --format json`, parses the array, filters where `configuration.labels['focus.cwd']` exists, and returns `[{ name: configuration.id, cwd: configuration.labels['focus.cwd'] }]`

#### Scenario: No running focus containers
- **WHEN** no containers with the `focus.cwd` label are running
- **THEN** `listFocusContainers` returns an empty array
