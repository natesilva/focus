# Container Launch

## Purpose

Defines the behavior for launching containers, including directory mounting, user identity, naming, and exit code handling.

## Requirements

### Requirement: Current directory mounted at /work/<dirname>
The container SHALL have the current working directory bind-mounted at `/work/<dirname>` inside the container, where `<dirname>` is the basename of the resolved working directory path. A per-project named volume (`focus-ws-<hash8>`) SHALL be mounted at `/work` first, and the project bind-mount SHALL be layered on top.

#### Scenario: Mount present at launch
- **WHEN** a container is launched for `~/dev/api-server`
- **THEN** the host directory is accessible inside the container at `/work/api-server`

#### Scenario: Named volume present at launch
- **WHEN** a container is launched for any project
- **THEN** the named volume `focus-ws-<hash8>` is mounted at `/work` in the container

#### Scenario: Workspace volume declared before project bind-mount
- **WHEN** the container runtime arguments are assembled
- **THEN** the `-v focus-ws-<hash8>:/work` argument appears before the `-v <cwd>:/work/<dirname>` argument

### Requirement: Non-root user with matching host UID
The container SHALL run as a non-root user whose numeric UID matches the host user's UID.

#### Scenario: User created at container start
- **WHEN** a container is launched
- **THEN** a user with the host UID exists inside the container, and the container process runs as that user

#### Scenario: Root user avoided
- **WHEN** a container is launched
- **THEN** `whoami` inside the container does not return `root`

### Requirement: Container user owns its home directory
The container entrypoint SHALL ensure the non-root container user owns its home directory so that tools can create dotfiles and lock files directly in `$HOME`. Because the runtime pre-creates the home directory as root in order to host bind-mounted volume subdirs (e.g. `~/.claude`), `useradd -m` finds the directory already present and does not take ownership; the entrypoint MUST therefore chown the home directory to the host UID. The chown SHALL NOT be recursive, so bind-mounted volume subdirectories retain their own ownership.

#### Scenario: Home directory writable by the container user
- **WHEN** a container is launched and the container process runs as the non-root user
- **THEN** the user's home directory is owned by that user's UID and the user can create a new file directly in `$HOME`

#### Scenario: Dotfile written in home succeeds
- **WHEN** a tool running as the container user writes a dotfile directly in `$HOME` (e.g. Claude Code writing `~/.claude.json`)
- **THEN** the write succeeds rather than failing or blocking on a permission-denied home directory

#### Scenario: Mounted volume ownership preserved
- **WHEN** the entrypoint takes ownership of the home directory
- **THEN** a bind-mounted volume subdirectory under the home (e.g. `~/.claude`) retains its existing ownership and is not recursively chowned

### Requirement: Stable container name derived from working directory
A container's name SHALL be deterministically derived from the absolute path of the working directory so that `stop` and `status` can locate it without stored state.

#### Scenario: Same directory yields same name
- **WHEN** `focus` is invoked twice in the same directory
- **THEN** both invocations compute the same container name

#### Scenario: Different directories yield different names
- **WHEN** `focus` is invoked in two different directories
- **THEN** the computed container names differ

### Requirement: Container image is determined by the image builder
The container image used at launch SHALL be the tag returned by the image builder, given `FocusConfig.tools` and `FocusConfig.image` as inputs. When `FocusConfig.tools` is empty, the image builder returns `FocusConfig.image` unchanged and no Docker build is performed.

#### Scenario: Default image when no tools configured
- **WHEN** no tools are specified in global or project config
- **THEN** the container is launched using `ubuntu:24.04` (the default base image, returned by the builder unchanged)

#### Scenario: Built image used when tools configured
- **WHEN** `.focus.yaml` specifies `tools: [git, ripgrep]`
- **THEN** the image builder is invoked with those profiles and the container is launched using the returned `focus-built:<hash>` tag

#### Scenario: Custom image from project config with no tools
- **WHEN** `.focus.yaml` specifies `image: debian:bookworm-slim` and no `tools`
- **THEN** the container is launched using `debian:bookworm-slim` (returned by the builder unchanged)

#### Scenario: Custom base image combined with tools
- **WHEN** `.focus.yaml` specifies both `image: debian:bookworm-slim` and `tools: [ripgrep]`
- **THEN** the image builder uses `debian:bookworm-slim` as the base and the container is launched using the resulting `focus-built:<hash>` tag

### Requirement: Network mode is config-driven
The container network mode SHALL be taken from `FocusConfig.network`.

#### Scenario: Default network (bridge)
- **WHEN** no network is specified in config
- **THEN** the container is launched with the default bridge network (no explicit `--network` flag)

#### Scenario: Air-gapped network
- **WHEN** `FocusConfig.network` is `"none"`
- **THEN** the container is launched with `--network none`

### Requirement: Working directory set to /work/<dirname> for exec and shell
The container exec invocation SHALL set the working directory to `/work/<dirname>` (where `<dirname>` is the basename of the project path), both for the initial shell launched by the entrypoint and for subsequent `docker exec` / `container exec` calls via `attachContainer`.

#### Scenario: Shell starts in project directory
- **WHEN** `focus shell` is run
- **THEN** the user's shell opens with the current directory set to `/work/<dirname>` (e.g. `/work/api-server`)

#### Scenario: Exec command runs in project directory
- **WHEN** `focus -- <cmd>` is used to run a command non-interactively
- **THEN** the command executes with its working directory set to `/work/<dirname>`

### Requirement: Persistent volume mounts included at launch
The container launch invocation SHALL include bind-mount arguments for all resolved volume mounts returned by the volume manager, in addition to the workspace volume and `/work/<dirname>` project bind-mount.

#### Scenario: Volume mounts passed to runtime
- **WHEN** a container is launched and the volume manager returns one or more mount descriptors
- **THEN** each descriptor is translated to a bind-mount argument (e.g. `-v <hostPath>:<containerPath>[:ro]`) in the runtime invocation

#### Scenario: Read-only flag honored
- **WHEN** a mount descriptor has `readOnly: true`
- **THEN** the bind-mount argument includes the `:ro` modifier

#### Scenario: No volumes when all slots are empty
- **WHEN** the volume manager returns an empty mount list (e.g. no `~/.gitconfig` and volumes dir missing)
- **THEN** no extra `-v` arguments are added and the container launches successfully with only the workspace volume and project bind-mount

### Requirement: Container launch includes identity labels
The container SHALL be started with Docker labels `focus.cwd` (absolute working directory path) and `focus.config-hash` (hash of the resolved tool list and base image) so that subsequent invocations can determine whether to attach or rebuild.

#### Scenario: Labels present on launched container
- **WHEN** a container is launched via the Docker runtime adapter
- **THEN** `docker inspect <name>` returns labels `focus.cwd` and `focus.config-hash` matching the values passed at launch time

### Requirement: Config hash includes layout version
The `configHash` function SHALL include a layout version constant in its input so that containers built with an incompatible mount layout are detected as stale and rebuilt.

#### Scenario: Old-layout containers rebuilt on upgrade
- **WHEN** a container was built with a previous layout version (e.g. before the subpath mount, or with the `/focus` mount root)
- **THEN** its stored config hash does not match the hash computed by the new code, causing a rebuild on next `focus shell`

#### Scenario: /focus-mounted containers detected as stale
- **WHEN** a container was built with the `/focus` workspace root (layout version 2)
- **THEN** its stored config hash does not match the hash computed with layout version 3, causing a stale-container prompt on next `focus` invocation

### Requirement: Attach replaces launch when container is already running
The `runContainer` function SHALL check whether a container with the current name is already running before launching. If a running container exists and its config hash matches, the function SHALL attach via the adapter's `exec` method instead of launching a new container. The adapter is resolved via `selectRuntime(config.runtime)` at the start of `runContainer`.

#### Scenario: Attach used instead of run
- **WHEN** `runContainer` is called and a container with the matching name and config hash is already running
- **THEN** the adapter's `exec` method is used to connect to it and no new container is started

#### Scenario: Docker adapter used when runtime is docker
- **WHEN** `FocusConfig.runtime` is `'docker'`
- **THEN** `runContainer` uses a `DockerRuntimeAdapter` for all container operations

#### Scenario: Apple Containers adapter used when runtime is apple-containers
- **WHEN** `FocusConfig.runtime` is `'apple-containers'`
- **THEN** `runContainer` uses an `AppleContainersRuntimeAdapter` for all container operations

#### Scenario: Auto detection selects correct adapter
- **WHEN** `FocusConfig.runtime` is `'auto'`
- **THEN** `runContainer` uses `selectRuntime('auto')` which returns the platform-appropriate adapter

### Requirement: Container launch sets terminal environment variables
Every container launched by focus SHALL have `TERM` set to `xterm-256color` and `COLORTERM` set to `truecolor` in its environment, regardless of the host terminal settings.

#### Scenario: TERM and COLORTERM present in launched container
- **WHEN** a container is launched
- **THEN** the environment inside the container includes `TERM=xterm-256color` and `COLORTERM=truecolor`

#### Scenario: Interactive tools render color
- **WHEN** a tool inside the container queries `TERM` or `COLORTERM` to determine color support
- **THEN** the values indicate a 24-bit color terminal, enabling full color output

### Requirement: Exit code propagation
When `focus -- <cmd>` is used, the exit code of the container process SHALL be propagated as the exit code of the `focus` process.

#### Scenario: Command succeeds
- **WHEN** the command inside the container exits with code 0
- **THEN** `focus` exits with code 0

#### Scenario: Command fails
- **WHEN** the command inside the container exits with a non-zero code
- **THEN** `focus` exits with the same non-zero code
