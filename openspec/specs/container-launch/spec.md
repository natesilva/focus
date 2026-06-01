# Container Launch

## Purpose

Defines the behavior for launching containers, including directory mounting, user identity, naming, and exit code handling.

## Requirements

### Requirement: Current directory mounted at /focus
The container SHALL have the current working directory bind-mounted at `/focus` inside the container.

#### Scenario: Mount present at launch
- **WHEN** a container is launched for a given working directory
- **THEN** the host directory is accessible inside the container at `/focus`

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

### Requirement: Container launch includes identity labels
The container SHALL be started with Docker labels `focus.cwd` (absolute working directory path) and `focus.config-hash` (hash of the resolved tool list and base image) so that subsequent invocations can determine whether to attach or rebuild.

#### Scenario: Labels present on launched container
- **WHEN** a container is launched via the Docker runtime adapter
- **THEN** `docker inspect <name>` returns labels `focus.cwd` and `focus.config-hash` matching the values passed at launch time

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

### Requirement: Exit code propagation
When `focus -- <cmd>` is used, the exit code of the container process SHALL be propagated as the exit code of the `focus` process.

#### Scenario: Command succeeds
- **WHEN** the command inside the container exits with code 0
- **THEN** `focus` exits with code 0

#### Scenario: Command fails
- **WHEN** the command inside the container exits with a non-zero code
- **THEN** `focus` exits with the same non-zero code
