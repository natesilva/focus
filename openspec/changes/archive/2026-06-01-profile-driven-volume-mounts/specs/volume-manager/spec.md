## REMOVED Requirements

### Requirement: Predefined volume slot catalog
**Reason**: The fixed SLOTS catalog is replaced by profile-declared volumes. Each profile declares which XDG-backed directories it needs via `profile.volumes`; the volume manager resolves those declarations rather than a hardcoded list.
**Migration**: No user-facing migration needed (pre-beta). Internal callers replace `resolveVolumeMounts()` with `resolveProfileVolumes(profiles, xdg, uid)`.

### Requirement: Missing git config file is skipped
**Reason**: The git host-passthrough mount is removed entirely. Git config passthrough will be addressed by the future volume-scoping feature (`scope: host`). The `git` tool profile continues to install the git binary; it simply no longer mounts `~/.gitconfig`.
**Migration**: None (pre-beta). Users who need git config inside the container can bind-mount it manually until the scoping feature ships.

## ADDED Requirements

### Requirement: Profile-declared volumes drive XDG directory mounts
The volume manager SHALL accept the resolved list of active profiles and, for each unique volume name declared across all `profile.volumes` arrays, create a corresponding XDG-backed host directory (if absent) and emit a `MountDescriptor` mapping it into the container. The host path is namespaced by the declaring profile's name (`<focusVolumesDir>/<profileName>/<volumeName>`); the container path uses the volume name verbatim (`<CONTAINER_HOME>/<volumeName>`). When the same volume name is declared by multiple profiles the first profile's namespace is used for the host path.

#### Scenario: Single profile declares a volume
- **WHEN** one active profile named `claude-code` declares `volumes: [".claude"]`
- **THEN** the resolved mount list includes a read-write descriptor with `hostPath: <focusVolumesDir>/claude-code/.claude` and `containerPath: /home/focususer/.claude`

#### Scenario: Multiple profiles declare volumes
- **WHEN** active profiles declare `volumes: [".claude"]` and `volumes: [".ssh"]` respectively
- **THEN** the resolved mount list includes descriptors for both `.claude` and `.ssh` volumes

#### Scenario: Volume declared by no active profile is not mounted
- **WHEN** no active profile declares `volumes: [".claude"]`
- **THEN** the resolved mount list does not include a mount for `containerPath: /home/focususer/.claude`

#### Scenario: Duplicate volume declaration across profiles is deduplicated
- **WHEN** two active profiles both declare `volumes: [".claude"]`
- **THEN** the resolved mount list includes exactly one descriptor for the `.claude` volume

#### Scenario: No volumes declared produces empty list
- **WHEN** all active profiles have empty `volumes` arrays
- **THEN** `resolveProfileVolumes` returns an empty list

## MODIFIED Requirements

### Requirement: Volume directories created on first use
The volume manager SHALL create the host directory for each profile-declared volume if it does not already exist, before the container is launched.

#### Scenario: First launch creates volume directory
- **WHEN** a container is launched and the host directory for a profile-declared volume does not exist
- **THEN** the directory is created (equivalent to `mkdir -p`) before the container starts

#### Scenario: Subsequent launches are idempotent
- **WHEN** the host volume directory already exists
- **THEN** no error is raised and the existing directory is used as-is

### Requirement: Volume directory ownership matches host UID
The volume manager SHALL ensure each newly-created volume directory is owned by the host user's UID so the non-root container user can read and write it.

#### Scenario: Created directory is owned by host user
- **WHEN** a volume directory is created by the volume manager
- **THEN** the directory owner UID equals the current process's UID

### Requirement: SSH volume created with restricted permissions
The `ssh` volume directory SHALL be created with mode `0700` to satisfy SSH client permission requirements.

#### Scenario: SSH directory mode
- **WHEN** the `ssh` volume directory is created
- **THEN** its Unix permission bits are `0700`

### Requirement: Volume manager returns resolved mount descriptors
The volume manager SHALL accept the list of active profiles and return a list of mount descriptors (host path, container path, read-only flag) that the runtime adapter can pass directly to the container launch invocation.

#### Scenario: Mount descriptor shape for profile-declared volume
- **WHEN** the volume manager resolves mounts for a profile named `claude-code` declaring `volumes: [".claude"]`
- **THEN** the descriptor includes `hostPath: <focusVolumesDir>/claude-code/.claude`, `containerPath: /home/focususer/.claude`, and `readOnly: false`
