## MODIFIED Requirements

### Requirement: Per-project named workspace volume
Each project SHALL have a dedicated named volume (`focus-ws-<hash8>`, where `hash8` is the same 8-character sha256 prefix of the resolved working directory path used to derive the container name) mounted at `/work` inside the container. This volume provides persistent storage for the `/work` namespace across container stop/start cycles.

#### Scenario: Workspace volume mounted at /work
- **WHEN** a container is launched for a project
- **THEN** a named volume `focus-ws-<hash8>` is mounted at `/work` inside the container

#### Scenario: Same project reuses the same volume
- **WHEN** a container is stopped and relaunched for the same working directory
- **THEN** the same `focus-ws-<hash8>` volume is used and any files previously written to `/work` (outside the bind-mounted project directory) persist

#### Scenario: Different projects use different volumes
- **WHEN** two projects with different working directory paths are active
- **THEN** each container has its own `focus-ws-<hash8>` volume and their `/work` namespaces are independent

### Requirement: Project directory mounted at /work/<dirname>
The project directory SHALL be bind-mounted at `/work/<dirname>` inside the container, where `<dirname>` is the basename of the resolved working directory path. This mount is layered on top of the workspace volume.

#### Scenario: Project files accessible at /work/<dirname>
- **WHEN** a container is launched for `~/dev/api-server`
- **THEN** the project files are accessible inside the container at `/work/api-server`

#### Scenario: Project files remain writable from host
- **WHEN** a file is edited on the host at `~/dev/api-server/src/foo.ts`
- **THEN** the change is immediately visible inside the container at `/work/api-server/src/foo.ts`

#### Scenario: Dirname collision is safe
- **WHEN** two projects share the same directory basename (e.g. `~/work/app` and `~/personal/app`)
- **THEN** each has its own container and workspace volume; their `/work` namespaces are independent

### Requirement: Git worktrees created as siblings persist across restarts
Files written to `/work` at paths other than `/work/<dirname>` (such as git worktrees created by tools like Claude Code) SHALL persist in the workspace volume across container stop/start cycles.

#### Scenario: Worktree survives container restart
- **WHEN** a git worktree is created at `/work/api-server-feature-x` inside the container, then the container is stopped and relaunched
- **THEN** the worktree directory is present at `/work/api-server-feature-x` in the new container
