# CLI Entrypoint (delta)

## ADDED Requirements

### Requirement: Init subcommand
`focus init` SHALL scaffold a `.focus.yaml` in the current working directory.

#### Scenario: Init invoked
- **WHEN** the user runs `focus init`
- **THEN** the system delegates to the init command handler and exits with its exit code

## MODIFIED Requirements

### Requirement: Default command launches container
When invoked with no subcommand, `focus` SHALL behave identically to `focus run`. Config is resolved from global and project config files before launching.

#### Scenario: Bare invocation
- **WHEN** the user runs `focus` with no arguments
- **THEN** the system resolves config, launches a container using that config, and drops into an interactive shell

#### Scenario: Explicit run
- **WHEN** the user runs `focus run`
- **THEN** the system resolves config, launches a container using that config, and the user receives an interactive shell prompt

#### Scenario: Command passthrough
- **WHEN** the user runs `focus -- <cmd> [args...]`
- **THEN** the system resolves config, executes `<cmd>` non-interactively inside the container, and exits with the command's exit code
