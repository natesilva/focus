# Builtin Profile YAML Loader

## Purpose

Defines how built-in profile definitions are loaded from bundled YAML files at startup, including path resolution, schema validation, and error handling for missing or malformed files.

## Requirements

### Requirement: Builtin profiles loaded from bundled YAML files
The system SHALL load built-in profile definitions from YAML files located in the `builtins/` directory adjacent to the profile loader source. Each file SHALL be named `<profile-name>.yaml` and SHALL conform to the custom profile YAML schema (same `install`, `volumes`, and `files` fields). The loader SHALL treat a missing or empty `builtins/` directory as a hard error.

#### Scenario: Builtin directory contains expected YAML files
- **WHEN** the builtins directory is read at startup
- **THEN** it contains YAML files for each expected built-in profile (git, ripgrep, node, python, rust, claude-code, ssh)

#### Scenario: Builtin YAML file parsed correctly
- **WHEN** `claude-code.yaml` is loaded from the builtins directory
- **THEN** the resulting profile has the expected install commands, `volumes: [".claude"]`, and `files: { "~/.claude.json": { json: {} } }`

#### Scenario: Invalid builtin YAML throws
- **WHEN** a YAML file in the builtins directory fails schema validation
- **THEN** the system throws an error identifying the file and the validation failure

#### Scenario: Missing builtins directory throws
- **WHEN** the builtins directory does not exist at the expected path
- **THEN** the system throws an error (not a silent no-op)

### Requirement: Builtin profile loader uses import.meta.dirname for path resolution
The loader SHALL resolve the builtins directory path relative to the executing module file using `import.meta.dirname`, so the path remains correct regardless of the process working directory.

#### Scenario: Builtins found regardless of working directory
- **WHEN** `focus` is invoked from a directory other than the project root
- **THEN** the builtins directory is located correctly and all built-in profiles are available
