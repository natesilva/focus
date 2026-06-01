# Volume Manager

## Purpose

Defines the catalog of named persistent volume slots and the behavior for resolving, creating, and returning mount descriptors that are passed to the container runtime at launch.

## Requirements

### Requirement: Predefined volume slot catalog
The system SHALL define a fixed catalog of named volume slots: `claude` (mounts `~/.claude`), `ssh` (mounts `~/.ssh`), and `git` (mounts `~/.gitconfig` read-only).

#### Scenario: Catalog includes claude slot
- **WHEN** the volume slot catalog is queried
- **THEN** a slot named `claude` exists with host path `<focusVolumesDir>/claude` and container path `~/.claude`

#### Scenario: Catalog includes ssh slot
- **WHEN** the volume slot catalog is queried
- **THEN** a slot named `ssh` exists with host path `<focusVolumesDir>/ssh` and container path `~/.ssh`

#### Scenario: Catalog includes git slot
- **WHEN** the volume slot catalog is queried
- **THEN** a slot named `git` exists with host source path `~/.gitconfig` and container path `/etc/gitconfig`, mounted read-only

### Requirement: Volume directories created on first use
The volume manager SHALL create the host directory for each directory-backed slot if it does not already exist, before the container is launched.

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

### Requirement: Missing git config file is skipped
If `~/.gitconfig` does not exist on the host, the `git` slot SHALL be omitted from the mount list rather than causing an error.

#### Scenario: git slot skipped when file absent
- **WHEN** `~/.gitconfig` does not exist on the host
- **THEN** the resolved mount list does not include the git slot

#### Scenario: git slot included when file present
- **WHEN** `~/.gitconfig` exists on the host
- **THEN** the resolved mount list includes the git slot as a read-only bind-mount

### Requirement: Volume manager returns resolved mount descriptors
The volume manager SHALL return a list of mount descriptors (host path, container path, read-only flag) that the runtime adapter can pass directly to the container launch invocation.

#### Scenario: Mount descriptor shape for directory slot
- **WHEN** the volume manager resolves mounts for the `claude` slot
- **THEN** the descriptor includes `hostPath`, `containerPath`, and `readOnly: false`

#### Scenario: Mount descriptor shape for file slot
- **WHEN** the volume manager resolves mounts for the `git` slot (file present)
- **THEN** the descriptor includes `hostPath` pointing to `~/.gitconfig`, `containerPath: /etc/gitconfig`, and `readOnly: true`

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
