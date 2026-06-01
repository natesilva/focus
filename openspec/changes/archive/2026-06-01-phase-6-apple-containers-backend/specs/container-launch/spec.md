## MODIFIED Requirements

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
