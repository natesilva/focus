## MODIFIED Requirements

### Requirement: Persistent volume mounts included at launch
The container launch invocation SHALL include bind-mount arguments for all resolved volume mounts returned by the volume manager, in addition to the `/focus` project mount.

#### Scenario: Volume mounts passed to runtime
- **WHEN** a container is launched and the volume manager returns one or more mount descriptors
- **THEN** each descriptor is translated to a bind-mount argument (e.g. `-v <hostPath>:<containerPath>[:ro]`) in the runtime invocation

#### Scenario: Read-only flag honored
- **WHEN** a mount descriptor has `readOnly: true`
- **THEN** the bind-mount argument includes the `:ro` modifier

#### Scenario: No volumes when all slots are empty
- **WHEN** the volume manager returns an empty mount list (e.g. no `~/.gitconfig` and volumes dir missing)
- **THEN** no extra `-v` arguments are added and the container launches successfully with only `/focus` mounted
