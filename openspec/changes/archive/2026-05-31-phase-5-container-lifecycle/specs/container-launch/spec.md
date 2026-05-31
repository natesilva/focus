## MODIFIED Requirements

### Requirement: Container launch includes identity labels
The container SHALL be started with Docker labels `focus.cwd` (absolute working directory path) and `focus.config-hash` (hash of the resolved tool list and base image) so that subsequent invocations can determine whether to attach or rebuild.

#### Scenario: Labels present on launched container
- **WHEN** a container is launched via the Docker runtime adapter
- **THEN** `docker inspect <name>` returns labels `focus.cwd` and `focus.config-hash` matching the values passed at launch time

### Requirement: Attach replaces launch when container is already running
The `runContainer` function SHALL check whether a container with the current name is already running before invoking `docker run`. If a running container exists and its config hash matches, the function SHALL attach via `docker exec` instead of launching a new container.

#### Scenario: Attach used instead of run
- **WHEN** `runContainer` is called and a container with the matching name and config hash is already running
- **THEN** `docker exec` is used to connect to it and no new container is started
