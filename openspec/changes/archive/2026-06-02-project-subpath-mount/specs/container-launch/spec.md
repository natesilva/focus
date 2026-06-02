## MODIFIED Requirements

### Requirement: Current directory mounted at /focus/<dirname>
The container SHALL have the current working directory bind-mounted at `/focus/<dirname>` inside the container, where `<dirname>` is the basename of the resolved working directory path. A per-project named volume (`focus-ws-<hash8>`) SHALL be mounted at `/focus` first, and the project bind-mount SHALL be layered on top.

#### Scenario: Mount present at launch
- **WHEN** a container is launched for `~/dev/api-server`
- **THEN** the host directory is accessible inside the container at `/focus/api-server`

#### Scenario: Named volume present at launch
- **WHEN** a container is launched for any project
- **THEN** the named volume `focus-ws-<hash8>` is mounted at `/focus` in the container

#### Scenario: Workspace volume declared before project bind-mount
- **WHEN** the container runtime arguments are assembled
- **THEN** the `-v focus-ws-<hash8>:/focus` argument appears before the `-v <cwd>:/focus/<dirname>` argument

## MODIFIED Requirements

### Requirement: Working directory set to /focus/<dirname> for exec and shell
The container exec invocation SHALL set the working directory to `/focus/<dirname>` (where `<dirname>` is the basename of the project path), both for the initial shell launched by the entrypoint and for subsequent `docker exec` / `container exec` calls via `attachContainer`.

#### Scenario: Shell starts in project directory
- **WHEN** `focus shell` is run
- **THEN** the user's shell opens with the current directory set to `/focus/<dirname>` (e.g. `/focus/api-server`)

#### Scenario: Exec command runs in project directory
- **WHEN** `focus -- <cmd>` is used to run a command non-interactively
- **THEN** the command executes with its working directory set to `/focus/<dirname>`

## ADDED Requirements

### Requirement: Config hash includes layout version
The `configHash` function SHALL include a layout version constant in its input so that containers built with an incompatible mount layout are detected as stale and rebuilt.

#### Scenario: Old-layout containers rebuilt on upgrade
- **WHEN** a container was built before the subpath mount layout was introduced
- **THEN** its stored config hash does not match the hash computed by the new code, causing a rebuild on next `focus shell`
