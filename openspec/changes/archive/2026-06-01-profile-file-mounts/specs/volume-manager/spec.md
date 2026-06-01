## ADDED Requirements

### Requirement: Profile-level file mounts
The system SHALL allow any profile (built-in or custom) to declare a list of container file paths to persist via a `files` field. Each declared path SHALL be bind-mounted from a host file whose location is derived automatically as `<focusVolumesDir>/<profile-name>/<filename>`. If the host file does not exist it SHALL be created empty and chowned to the host UID before the container starts.

#### Scenario: Host file created on first use
- **WHEN** a profile declares a file path and the derived host file does not exist
- **THEN** the host file is created empty and its owner UID equals the host user's UID

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

### Requirement: claude-code profile persists ~/.claude.json
The built-in `claude-code` profile SHALL declare `~/.claude.json` in its `files` list so that Claude Code's account identity state is preserved across container sessions.

#### Scenario: claude-code mounts ~/.claude.json
- **WHEN** a container is launched with the `claude-code` profile
- **THEN** the resolved mount list includes a read-write bind-mount of `~/.claude.json` in the container

## MODIFIED Requirements

### Requirement: Predefined volume slot catalog
The system SHALL define a fixed catalog of named volume slots: `claude` (mounts `~/.claude`), `ssh` (mounts `~/.ssh`), and `git` (mounts `~/.gitconfig` read-only). Individual tool config files are NOT added to this catalog; they are declared in tool profiles via the `files` field.

#### Scenario: Catalog includes claude slot
- **WHEN** the volume slot catalog is queried
- **THEN** a slot named `claude` exists with host path `<focusVolumesDir>/claude` and container path `~/.claude`

#### Scenario: Catalog includes ssh slot
- **WHEN** the volume slot catalog is queried
- **THEN** a slot named `ssh` exists with host path `<focusVolumesDir>/ssh` and container path `~/.ssh`

#### Scenario: Catalog includes git slot
- **WHEN** the volume slot catalog is queried
- **THEN** a slot named `git` exists with host source path `~/.gitconfig` and container path `/etc/gitconfig`, mounted read-only
