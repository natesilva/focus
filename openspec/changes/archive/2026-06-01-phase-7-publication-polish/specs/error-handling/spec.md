## ADDED Requirements

### Requirement: Runtime not found produces actionable error
When the selected runtime binary is not found, the CLI SHALL exit with a non-zero code and print a human-readable message that identifies the missing runtime and provides a remediation hint.

#### Scenario: Docker binary missing
- **WHEN** the Docker runtime adapter cannot locate the `docker` binary
- **THEN** the CLI prints a message indicating Docker was not found and suggests installing Docker or switching runtime, then exits with a non-zero code

#### Scenario: Apple Containers binary missing
- **WHEN** the Apple Containers runtime adapter cannot locate the `container` binary
- **THEN** the CLI prints a message indicating Apple Containers requires macOS 26 or later, then exits with a non-zero code

### Requirement: Image build failure produces actionable error
When the container image build fails, the CLI SHALL exit with a non-zero code and print a message that identifies the failing profile and suggests checking the network or the profile definition.

#### Scenario: Build exits non-zero
- **WHEN** the runtime adapter's `buildImage` call fails
- **THEN** the CLI prints a message referencing the build failure and exits with a non-zero code

### Requirement: Config validation failure reports the offending file
When a config file fails schema validation, the CLI SHALL exit with a non-zero code and print a message that identifies the offending file path and the validation error.

#### Scenario: Invalid project config
- **WHEN** `.focus.yaml` contains an unrecognized field or invalid value
- **THEN** the CLI prints the path to `.focus.yaml` and the validation error, then exits with a non-zero code

#### Scenario: Invalid global config
- **WHEN** `~/.config/focus/config.yaml` contains an unrecognized field or invalid value
- **THEN** the CLI prints the path to the global config file and the validation error, then exits with a non-zero code

### Requirement: Errors are formatted without stack traces
In production use, the CLI SHALL NOT print Node.js stack traces for user-facing error conditions. Stack traces are reserved for unexpected internal errors.

#### Scenario: Known error prints clean message
- **WHEN** a known failure mode occurs (runtime not found, build failure, config validation)
- **THEN** the output contains a single human-readable line, not a JavaScript stack trace

#### Scenario: Unknown error preserves stack trace
- **WHEN** an unexpected internal error is thrown
- **THEN** the stack trace is printed to stderr to aid debugging
