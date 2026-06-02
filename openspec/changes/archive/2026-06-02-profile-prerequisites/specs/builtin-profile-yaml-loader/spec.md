## MODIFIED Requirements

### Requirement: Builtin profiles loaded from bundled YAML files
The system SHALL load built-in profile definitions from YAML files located in the `builtins/` directory adjacent to the profile loader source. Each file SHALL be named `<profile-name>.yaml` and SHALL conform to the profile YAML schema (`install`, `prerequisites`, `volumes`, and `files` fields). The loader SHALL treat a missing or empty `builtins/` directory as a hard error.

#### Scenario: Builtin directory contains expected YAML files
- **WHEN** the builtins directory is read at startup
- **THEN** it contains YAML files for each expected built-in profile (git, ripgrep, node, python, rust, claude-code, ssh)

#### Scenario: Builtin YAML file parsed correctly — claude-code
- **WHEN** `claude-code.yaml` is loaded from the builtins directory
- **THEN** the resulting profile has `prerequisites: ["node"]`, install commands that install the Claude Code npm package (but do not install Node.js), `volumes: [".claude"]`, and `files: { "~/.claude.json": { json: {} } }`

#### Scenario: Invalid builtin YAML throws
- **WHEN** a YAML file in the builtins directory fails schema validation
- **THEN** the system throws an error identifying the file and the validation failure

#### Scenario: Missing builtins directory throws
- **WHEN** the builtins directory does not exist at the expected path
- **THEN** the system throws an error (not a silent no-op)
