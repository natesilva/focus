## MODIFIED Requirements

### Requirement: Profile schema
A profile definition SHALL conform to a schema with the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `install` | `string[]` | yes | Ordered shell commands for the `RUN` layer |
| `prerequisites` | `string[]` | no (default `[]`) | Profile names that must be installed before this one |
| `volumes` | `string[]` | no (default `[]`) | XDG volume directory names this profile requires |
| `files` | `Record<string, FileInit \| null>` | no (default `{}`) | Container file paths to persist, with optional init content |

Where `FileInit` is `{ json: unknown }` or `{ text: string }`.

#### Scenario: Profile with only install field is valid
- **WHEN** a custom profile YAML contains only the `install` field
- **THEN** validation succeeds and `prerequisites`, `volumes`, and `files` all default to their empty values

#### Scenario: Profile missing install field is invalid
- **WHEN** a custom profile YAML omits the `install` field
- **THEN** the system throws a validation error

#### Scenario: Profile with prerequisites field is valid
- **WHEN** a custom profile YAML contains `prerequisites: [node]`
- **THEN** validation succeeds and the profile's prerequisites list contains `"node"`

### Requirement: Predefined profile catalog
The system SHALL define a built-in catalog of named tool profiles loaded from bundled YAML files at `src/profiles/builtins/<name>.yaml`. Each profile SHALL declare an ordered list of shell install commands, an optional list of prerequisite profile names, and an optional list of XDG volume directory names it requires. Volume names in `profile.volumes` are used verbatim by the volume manager and are load-bearing: the volume manager uses them to determine which XDG-backed directories to create and mount. A profile with an empty `volumes` list produces no directory mounts.

#### Scenario: Catalog contains expected predefined profiles
- **WHEN** the built-in profile catalog is queried
- **THEN** it contains entries for `git`, `ripgrep`, `node`, `python`, `rust`, `claude-code`, and `ssh`

#### Scenario: claude-code declares node as a prerequisite
- **WHEN** the `claude-code` built-in profile is looked up
- **THEN** its prerequisites list contains `"node"`

#### Scenario: claude-code install steps do not include Node.js installation
- **WHEN** the `claude-code` built-in profile is looked up
- **THEN** its install commands do not include steps to install Node.js (those steps are delegated to the `node` prerequisite)

#### Scenario: Profile exposes install commands
- **WHEN** the `ripgrep` profile is looked up
- **THEN** it returns a non-empty list of shell commands that install ripgrep

#### Scenario: Profile with volume declaration
- **WHEN** the `claude-code` profile is looked up
- **THEN** it declares `.claude` in its volumes list

#### Scenario: Profile with no volume declaration
- **WHEN** the `ripgrep` profile is looked up
- **THEN** its volumes list is empty
