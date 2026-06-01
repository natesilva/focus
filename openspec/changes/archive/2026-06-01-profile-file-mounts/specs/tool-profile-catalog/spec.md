## ADDED Requirements

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

## MODIFIED Requirements

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
