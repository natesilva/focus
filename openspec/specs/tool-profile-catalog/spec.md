# Tool Profile Catalog

## Purpose

Defines the built-in catalog of named tool profiles and the mechanism for resolving profile definitions by name, including user-defined custom profiles.

## Requirements

### Requirement: Predefined profile catalog
The system SHALL define a built-in catalog of named tool profiles. Each profile SHALL declare an ordered list of shell install commands and an optional list of volume slot names it requires.

#### Scenario: Catalog contains expected predefined profiles
- **WHEN** the built-in profile catalog is queried
- **THEN** it contains entries for `git`, `ripgrep`, `node`, `python`, `rust`, `claude-code`, and `ssh`

#### Scenario: Profile exposes install commands
- **WHEN** the `ripgrep` profile is looked up
- **THEN** it returns a non-empty list of shell commands that install ripgrep

#### Scenario: Profile with volume slot
- **WHEN** the `claude-code` profile is looked up
- **THEN** it declares `claude` in its volumes list

#### Scenario: Profile with no volume slot
- **WHEN** the `ripgrep` profile is looked up
- **THEN** its volumes list is empty

### Requirement: Profile lookup by name
The system SHALL resolve a profile name to its definition, merging the custom profile directory (searched first) with the built-in catalog (fallback).

#### Scenario: Known built-in profile resolves
- **WHEN** `getProfile("node")` is called and no custom profile named `node` exists
- **THEN** the built-in node profile definition is returned

#### Scenario: Unknown profile name throws
- **WHEN** `getProfile("nonexistent")` is called and no custom profile with that name exists
- **THEN** the system throws an error identifying the unknown profile name

#### Scenario: Custom profile overrides built-in
- **WHEN** a custom profile file named `node.yaml` exists in `<focusConfigDir>/profiles/`
- **THEN** `getProfile("node")` returns the custom definition, not the built-in one

### Requirement: Custom profile loading
The system SHALL load user-defined profiles from YAML files at `<focusConfigDir>/profiles/<name>.yaml`.

#### Scenario: Valid custom profile loaded
- **WHEN** `<focusConfigDir>/profiles/mytools.yaml` exists with a valid `install` list
- **THEN** `getProfile("mytools")` returns the parsed profile

#### Scenario: Custom profile directory absent
- **WHEN** `<focusConfigDir>/profiles/` does not exist
- **THEN** no error is raised; only built-in profiles are available

#### Scenario: Invalid custom profile YAML throws
- **WHEN** a custom profile YAML file exists but fails schema validation (e.g., `install` is not an array)
- **THEN** the system throws an error identifying the file and the validation failure

#### Scenario: Custom profile with volume slots
- **WHEN** a custom profile YAML file declares `volumes: [ssh]`
- **THEN** the loaded profile's volumes list contains `ssh`

### Requirement: Profile schema
A profile definition SHALL conform to a schema with the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `install` | `string[]` | yes | Ordered shell commands for the `RUN` layer |
| `volumes` | `string[]` | no (default `[]`) | Volume slot names this profile requires |
| `files` | `string[]` | no (default `[]`) | Container file paths to persist across sessions |

#### Scenario: Profile with only install field is valid
- **WHEN** a custom profile YAML contains only the `install` field
- **THEN** validation succeeds and `volumes` and `files` both default to `[]`

#### Scenario: Profile missing install field is invalid
- **WHEN** a custom profile YAML omits the `install` field
- **THEN** the system throws a validation error

### Requirement: Profile files field
A profile MAY declare a `files` list of container-relative paths (using `~/` for home-relative paths) that the volume manager SHALL persist across container sessions. This field is optional and defaults to empty.

#### Scenario: Profile with files field is valid
- **WHEN** a custom profile YAML contains a `files` list with one or more path strings
- **THEN** validation succeeds and the profile's files list contains those paths

#### Scenario: Profile without files field defaults to empty
- **WHEN** a custom profile YAML omits the `files` field
- **THEN** validation succeeds and the profile's files list is `[]`

#### Scenario: claude-code profile declares ~/.claude.json
- **WHEN** the `claude-code` built-in profile is looked up
- **THEN** its files list contains `~/.claude.json`
