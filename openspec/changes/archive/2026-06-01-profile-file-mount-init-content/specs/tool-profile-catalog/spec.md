## MODIFIED Requirements

### Requirement: Profile schema
A profile definition SHALL conform to a schema with the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `install` | `string[]` | yes | Ordered shell commands for the `RUN` layer |
| `volumes` | `string[]` | no (default `{}`) | Volume slot names this profile requires |
| `files` | `Record<string, FileInit \| null>` | no (default `{}`) | Container file paths to persist, with optional init content |

Where `FileInit` is `{ json: unknown }` or `{ text: string }`.

#### Scenario: Profile with only install field is valid
- **WHEN** a custom profile YAML contains only the `install` field
- **THEN** validation succeeds and `volumes` and `files` both default to `{}`

#### Scenario: Profile missing install field is invalid
- **WHEN** a custom profile YAML omits the `install` field
- **THEN** the system throws a validation error

### Requirement: Profile files field
A profile MAY declare a `files` map whose keys are container-relative paths (using `~/` for home-relative paths) and whose values are `null` (seed empty) or a `FileInit` object (`{ json: unknown }` or `{ text: string }`). The volume manager SHALL persist each declared file across container sessions using the specified init content when first creating it. This field is optional and defaults to an empty map.

#### Scenario: Profile with files map using null init is valid
- **WHEN** a custom profile YAML contains a `files` map with a path key and `null` value
- **THEN** validation succeeds and the profile's files map contains that entry

#### Scenario: Profile with files map using json init is valid
- **WHEN** a custom profile YAML contains a `files` map entry with a `json` init value
- **THEN** validation succeeds and the profile's files map contains that entry with its json value

#### Scenario: Profile with files map using text init is valid
- **WHEN** a custom profile YAML contains a `files` map entry with a `text` init value
- **THEN** validation succeeds and the profile's files map contains that entry with its text value

#### Scenario: Profile with files as string array is invalid
- **WHEN** a custom profile YAML declares `files` as an array (old format)
- **THEN** the system throws a validation error identifying the invalid shape

#### Scenario: Profile without files field defaults to empty map
- **WHEN** a custom profile YAML omits the `files` field
- **THEN** validation succeeds and the profile's files map is `{}`

#### Scenario: claude-code profile declares ~/.claude.json with json init
- **WHEN** the `claude-code` built-in profile is looked up
- **THEN** its files map contains `~/.claude.json` with init `{ json: {} }`
