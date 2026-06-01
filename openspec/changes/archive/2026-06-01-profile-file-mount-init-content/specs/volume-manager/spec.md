## MODIFIED Requirements

### Requirement: Profile-level file mounts
The system SHALL allow any profile (built-in or custom) to declare a map of container file paths to persist via a `files` field. Keys are `~/`-prefixed container paths; values are `null` (create empty) or a `FileInit` object (`{ json: unknown }` or `{ text: string }`). Each declared path SHALL be bind-mounted from a host file whose location is derived automatically as `<focusVolumesDir>/<profile-name>/<filename>`. If the host file does not exist it SHALL be created with the declared init content (or empty if `null`) and chowned to the host UID before the container starts.

#### Scenario: Host file created empty when init is null
- **WHEN** a profile declares a file path with `null` init and the derived host file does not exist
- **THEN** the host file is created as an empty file and its owner UID equals the host user's UID

#### Scenario: Host file created with JSON content
- **WHEN** a profile declares a file path with `{ json: {} }` init and the derived host file does not exist
- **THEN** the host file is created containing `{}` (the serialized JSON) and its owner UID equals the host user's UID

#### Scenario: Host file created with text content
- **WHEN** a profile declares a file path with `{ text: "hello" }` init and the derived host file does not exist
- **THEN** the host file is created containing `hello` and its owner UID equals the host user's UID

#### Scenario: Existing host file used as-is
- **WHEN** a profile declares a file path and the derived host file already exists
- **THEN** no error is raised and the existing file is mounted without modification

#### Scenario: Mount always included
- **WHEN** a profile declares a file path (host file present or newly created)
- **THEN** a read-write mount descriptor for that file is included in the resolved mount list

#### Scenario: Host path namespaced by profile name
- **WHEN** profile `claude-code` declares `~/.claude.json`
- **THEN** the host path is `<focusVolumesDir>/claude-code/.claude.json`

#### Scenario: Tilde expanded to container home
- **WHEN** a profile declares a path beginning with `~/`
- **THEN** the container path substitutes `~` with `/home/focususer`

#### Scenario: Absolute path rejected
- **WHEN** a profile declares a file path that does not begin with `~/`
- **THEN** the system throws an error identifying the invalid path

#### Scenario: Files from multiple profiles all mounted
- **WHEN** multiple active profiles each declare one or more file paths
- **THEN** the resolved mount list includes file mounts from all profiles
