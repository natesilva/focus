## MODIFIED Requirements

### Requirement: Stop subcommand
`focus stop` SHALL stop the running container associated with the current working directory.

#### Scenario: Container is running
- **WHEN** the user runs `focus stop` and a container for the current directory is running
- **THEN** the container is stopped, a confirmation message is printed, and the system exits with code 0

#### Scenario: No container running
- **WHEN** the user runs `focus stop` and no container for the current directory is running
- **THEN** the system exits with code 0 and prints a message indicating nothing was running

### Requirement: Status subcommand
`focus status` SHALL report whether a container is currently running for the current working directory, and whether its config hash matches the current resolved config.

#### Scenario: Container running with current config
- **WHEN** the user runs `focus status` and a matching container is running
- **THEN** the system prints a line indicating the container is running with current config and exits with code 0

#### Scenario: Container running with stale config
- **WHEN** the user runs `focus status` and a container is running but its config hash differs from current
- **THEN** the system prints a line indicating the container is running but config has changed, and exits with code 0

#### Scenario: Container not running
- **WHEN** the user runs `focus status` and no container for the current directory is running
- **THEN** the system prints a line indicating no container is running and exits with code 0

### Requirement: Run subcommand resolves config before identity check
`focus run` (and bare `focus`) SHALL resolve the full config before checking container identity, so the config hash used for the identity check reflects any per-project `.focus.yaml` overrides.

#### Scenario: Config resolved before identity check
- **WHEN** the user runs `focus run` in a directory with a `.focus.yaml`
- **THEN** the config (including project overrides) is fully resolved before the running-container check is performed
