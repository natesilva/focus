# CLI Entrypoint

## Purpose

Defines the commands and flags exposed by the `focus` binary to the end user.

## Requirements

### Requirement: Default command launches container
When invoked with no subcommand, `focus` SHALL behave identically to `focus run`. Config is resolved from global and project config files before launching.

#### Scenario: Bare invocation
- **WHEN** the user runs `focus` with no arguments
- **THEN** the system resolves config, launches a container using that config, and drops into an interactive shell

### Requirement: Run subcommand
`focus run` SHALL start a container for the current working directory and attach an interactive shell.

#### Scenario: Explicit run
- **WHEN** the user runs `focus run`
- **THEN** the system resolves config, launches a container using that config, and the user receives an interactive shell prompt

#### Scenario: Command passthrough
- **WHEN** the user runs `focus -- <cmd> [args...]`
- **THEN** the system resolves config, executes `<cmd>` non-interactively inside the container, and exits with the command's exit code

### Requirement: Init subcommand
`focus init` SHALL scaffold a `.focus.yaml` in the current working directory.

#### Scenario: Init invoked
- **WHEN** the user runs `focus init`
- **THEN** the system delegates to the init command handler and exits with its exit code

### Requirement: Stop subcommand
`focus stop` SHALL stop the running container associated with the current working directory.

#### Scenario: Container is running
- **WHEN** the user runs `focus stop` and a container for the current directory is running
- **THEN** the container is stopped and the system exits with code 0

#### Scenario: No container running
- **WHEN** the user runs `focus stop` and no container for the current directory is running
- **THEN** the system exits with code 0 and prints a message indicating nothing was running

### Requirement: Status subcommand
`focus status` SHALL report whether a container is currently running for the current working directory.

#### Scenario: Container running
- **WHEN** the user runs `focus status` and a container for the current directory is running
- **THEN** the system prints a line indicating the container is running and exits with code 0

#### Scenario: Container not running
- **WHEN** the user runs `focus status` and no container for the current directory is running
- **THEN** the system prints a line indicating no container is running and exits with code 0
