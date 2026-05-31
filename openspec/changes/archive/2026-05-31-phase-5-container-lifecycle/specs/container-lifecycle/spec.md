## ADDED Requirements

### Requirement: Attach to a running container with matching identity
When a container for the current directory is already running with a config hash that matches the current resolved config, `focus` SHALL attach to it via `docker exec` rather than starting a new container.

#### Scenario: Interactive attach with TTY
- **WHEN** `focus` (or `focus run`) is invoked, a matching container is running, and stdin is a TTY
- **THEN** `docker exec --user <uid> -it <name> /bin/bash` is used to attach an interactive shell

#### Scenario: Interactive attach without TTY
- **WHEN** `focus` (or `focus run`) is invoked, a matching container is running, and stdin is not a TTY
- **THEN** `docker exec --user <uid> -i <name> /bin/bash` is used (no TTY allocation)

#### Scenario: Command passthrough attach
- **WHEN** `focus -- <cmd> [args...]` is invoked and a matching container is running
- **THEN** `docker exec --user <uid> -i <name> <cmd> [args...]` is used and the exit code is propagated

### Requirement: Rebuild prompt when config has changed (interactive)
When a container for the current directory is already running but its config hash differs from the current resolved config, and the invocation is interactive, `focus` SHALL print a warning and prompt the user to confirm a rebuild before proceeding.

#### Scenario: User confirms rebuild
- **WHEN** a config mismatch is detected in interactive mode and the user answers Y (or presses Enter)
- **THEN** the running container is stopped and a new container is launched with the updated config

#### Scenario: User declines rebuild
- **WHEN** a config mismatch is detected in interactive mode and the user answers n
- **THEN** the running container is left in place and `focus` exits with code 0

### Requirement: Auto-rebuild on config change for non-interactive passthrough
When `focus -- <cmd>` is invoked and a running container's config hash differs from the current resolved config, `focus` SHALL automatically stop the old container and launch a new one without prompting, printing a notice to stderr.

#### Scenario: Auto-rebuild triggered
- **WHEN** `focus -- <cmd>` detects a config mismatch
- **THEN** a notice is printed to stderr, the old container is stopped, a new container is launched, and the command runs in the new container

### Requirement: Stop command tears down the running container
`focus stop` SHALL stop the running container for the current directory and exit cleanly whether or not a container was running.

#### Scenario: Container stopped successfully
- **WHEN** `focus stop` is run and a container for the current directory is running
- **THEN** the container is stopped and the system exits with code 0 printing a confirmation

#### Scenario: Nothing to stop
- **WHEN** `focus stop` is run and no container for the current directory is running
- **THEN** the system exits with code 0 and prints a message indicating nothing was running

### Requirement: Status command reports running state
`focus status` SHALL report whether a container for the current directory is currently running, along with whether its config hash matches the current resolved config.

#### Scenario: Container running with current config
- **WHEN** `focus status` is run and a matching container is running
- **THEN** output indicates the container is running and the config is current, exits with code 0

#### Scenario: Container running with stale config
- **WHEN** `focus status` is run and a container is running but its config hash differs from current
- **THEN** output indicates the container is running but config has changed, exits with code 0

#### Scenario: No container running
- **WHEN** `focus status` is run and no container for the current directory is running
- **THEN** output indicates no container is running, exits with code 0

### Requirement: Orphaned containers pruned on launch
On every `focus run` invocation, the system SHALL enumerate all running focus containers (via the `focus.cwd` label) and stop any whose `focus.cwd` path no longer exists on the host filesystem.

#### Scenario: Orphan detected and removed
- **WHEN** a focus container's `focus.cwd` directory does not exist on the host
- **THEN** that container is stopped during the next `focus run` invocation in any directory

#### Scenario: No orphans present
- **WHEN** all running focus containers have valid `focus.cwd` paths
- **THEN** no containers are stopped and the launch proceeds normally
