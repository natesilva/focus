## ADDED Requirements

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
