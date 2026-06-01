## MODIFIED Requirements

### Requirement: Predefined profile catalog
The system SHALL define a built-in catalog of named tool profiles. Each profile SHALL declare an ordered list of shell install commands and an optional list of XDG volume directory names it requires. Volume names in `profile.volumes` are used verbatim by the volume manager and are now load-bearing: the volume manager uses them to determine which XDG-backed directories to create and mount. A profile with an empty `volumes` list produces no directory mounts.

#### Scenario: Catalog contains expected predefined profiles
- **WHEN** the built-in profile catalog is queried
- **THEN** it contains entries for `git`, `ripgrep`, `node`, `python`, `rust`, `claude-code`, and `ssh`

#### Scenario: Profile exposes install commands
- **WHEN** the `ripgrep` profile is looked up
- **THEN** it returns a non-empty list of shell commands that install ripgrep

#### Scenario: Profile with volume declaration
- **WHEN** the `claude-code` profile is looked up
- **THEN** it declares `.claude` in its volumes list

#### Scenario: Profile with no volume declaration
- **WHEN** the `ripgrep` profile is looked up
- **THEN** its volumes list is empty

#### Scenario: claude-code volume declaration drives a directory mount
- **WHEN** a container is launched with the `claude-code` profile active
- **THEN** the volume manager creates and mounts `<focusVolumesDir>/claude-code/.claude` into the container at `/home/focususer/.claude`

#### Scenario: ssh volume declaration drives a directory mount
- **WHEN** a container is launched with the `ssh` profile active
- **THEN** the volume manager creates and mounts `<focusVolumesDir>/ssh/.ssh` into the container at `/home/focususer/.ssh`
