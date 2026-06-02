# Project Workspace Volume

## Purpose

Defines the per-project named volume that provides persistent storage at `/work` inside the container, enabling worktree and tool state to survive container restarts while keeping the project bind-mount layered at `/work/<dirname>`.

## Requirements

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

### Requirement: /work directory writable by the container user
The container entrypoint SHALL `chown` the `/work` directory to the container user (`$FOCUS_UID`) so that the user can create git worktrees and other directories alongside the project bind-mount. This `chown` SHALL be non-recursive: `/work/<dirname>` is a bind-mount whose ownership derives from the host filesystem and SHALL NOT be overridden.

#### Scenario: User can create worktrees in /work
- **WHEN** the container starts and the user runs `git worktree add /work/<project>-branch`
- **THEN** git can create the worktree directory under `/work` without a permission error

#### Scenario: Bind-mounted project directory ownership unchanged
- **WHEN** the entrypoint runs `chown $FOCUS_UID /work`
- **THEN** the ownership of `/work/<dirname>` (the bind-mounted project directory) is unaffected

### Requirement: Git worktrees created as siblings persist across restarts
Files written to `/work` at paths other than `/work/<dirname>` (such as git worktrees created by tools like Claude Code) SHALL persist in the workspace volume across container stop/start cycles.

#### Scenario: Worktree survives container restart
- **WHEN** a git worktree is created at `/work/api-server-feature-x` inside the container, then the container is stopped and relaunched
- **THEN** the worktree directory is present at `/work/api-server-feature-x` in the new container

### Requirement: Workspace volume name mirrors container name for cleanup
The workspace volume name (`focus-ws-<hash8>`) SHALL use the same `hash8` prefix as the container name (`focus-<hash8>`), enabling a future `focus prune` command to identify and remove orphaned workspace volumes by name without requiring volume labels.

#### Scenario: Volume name derivable from container name
- **WHEN** a container is named `focus-abc12345`
- **THEN** its workspace volume is named `focus-ws-abc12345`

### Requirement: Stale git worktree metadata pruned on container start
The container entrypoint SHALL run `git worktree prune` in the project directory on each container start to remove stale worktree metadata entries from `.git/worktrees/`. The command SHALL be silenced and non-fatal so containers that are not git repositories start normally.

#### Scenario: Stale worktree metadata cleared on start
- **WHEN** a worktree directory has been deleted but its `.git/worktrees/` metadata entry remains, and the container is started
- **THEN** `git worktree prune` removes the stale entry so `git worktree list` no longer shows it

#### Scenario: Non-git project starts without error
- **WHEN** the project directory is not a git repository and the container starts
- **THEN** the container starts successfully and the user is dropped into the shell without error
