## MODIFIED Requirements

### Requirement: Version flag prints package version
`focus --version` SHALL print the current package version and exit with code 0. This flag SHALL take precedence over any subcommand.

#### Scenario: Version flag
- **WHEN** the user runs `focus --version`
- **THEN** the CLI prints a version string containing the package version and exits with code 0

#### Scenario: Version flag with subcommand
- **WHEN** the user runs `focus run --version`
- **THEN** the CLI prints the version string and exits with code 0, ignoring the subcommand
