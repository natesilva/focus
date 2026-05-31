# Focus Init

## ADDED Requirements

### Requirement: Scaffold a .focus.yaml in the current directory
`focus init` SHALL create a `.focus.yaml` file in the current working directory populated with commented-out fields showing all available options and their defaults.

#### Scenario: No existing .focus.yaml
- **WHEN** `focus init` is run in a directory with no `.focus.yaml`
- **THEN** a `.focus.yaml` is created with a helpful scaffold showing all supported fields

#### Scenario: .focus.yaml already exists
- **WHEN** `focus init` is run in a directory that already has a `.focus.yaml`
- **THEN** the system prints an error message and exits with a non-zero code without modifying the existing file

### Requirement: Scaffold content is a valid .focus.yaml
The scaffolded `.focus.yaml` SHALL be valid according to the project config schema when parsed (ignoring comments).

#### Scenario: Scaffold parses cleanly
- **WHEN** the scaffolded file is loaded by the project config loader
- **THEN** it parses without validation errors (an empty/all-defaults file is valid)

### Requirement: Init confirms success
After creating `.focus.yaml`, `focus init` SHALL print a confirmation message indicating the file was created.

#### Scenario: File created
- **WHEN** `focus init` successfully creates `.focus.yaml`
- **THEN** the system prints a message like `Created .focus.yaml` and exits with code 0
