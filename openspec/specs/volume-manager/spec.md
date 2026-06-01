# Volume Manager

## Purpose

Defines the behavior for resolving, creating, and returning mount descriptors driven by profile-declared volumes that are passed to the container runtime at launch.

## Requirements

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

### Requirement: Volume directories created on first use
The volume manager SHALL create the host directory for each profile-declared volume if it does not already exist, before the container is launched.

#### Scenario: First launch creates volume directory
- **WHEN** a container is launched and the host volume directory does not exist
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

### Requirement: Volumes reachable when the container home differs from the canonical home
Persistent volumes are mounted at canonical paths under `/home/focususer`. When the host UID maps to a pre-existing user in the base image whose home directory differs from `/home/focususer` (e.g. `ubuntu:24.04` ships a user `ubuntu` at UID 1000 with home `/home/ubuntu`), the container entrypoint SHALL make each mounted volume reachable at the running user's actual home by symlinking the volume dotdirs from `/home/focususer` into that home. An existing entry at the target path SHALL NOT be overwritten.

#### Scenario: Volumes symlinked into a divergent home
- **WHEN** a container is launched whose host UID maps to an image user with a home other than `/home/focususer`
- **THEN** each volume directory mounted under `/home/focususer` (e.g. `.claude`, `.ssh`) is reachable at the corresponding path in the running user's actual home

#### Scenario: Canonical home needs no symlinks
- **WHEN** the running user's home is `/home/focususer`
- **THEN** the volumes are already at their canonical paths and no symlinks are created

#### Scenario: Existing target left intact
- **WHEN** the running user's home already contains an entry at a target volume path
- **THEN** the entrypoint does not overwrite it with a symlink

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

### Requirement: claude-code profile persists ~/.claude.json
The built-in `claude-code` profile SHALL declare `~/.claude.json` in its `files` list so that Claude Code's account identity state is preserved across container sessions.

#### Scenario: claude-code mounts ~/.claude.json
- **WHEN** a container is launched with the `claude-code` profile
- **THEN** the resolved mount list includes a read-write bind-mount of `~/.claude.json` in the container
