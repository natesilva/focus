## ADDED Requirements

### Requirement: RuntimeAdapter interface
The system SHALL define a `RuntimeAdapter` interface with five methods — `start`, `exec`, `inspect`, `stop`, and `listFocusContainers` — whose signatures match the Docker module's exported functions exactly, so that any backend can be substituted without changing call sites.

#### Scenario: Interface methods match Docker module signatures
- **WHEN** a new adapter class implements `RuntimeAdapter`
- **THEN** it must provide `start(opts: StartOptions): Promise<number>`, `exec(name, uid, command, tty): Promise<number>`, `inspect(name): Promise<InspectResult>`, `stop(name): Promise<{ stopped: boolean }>`, and `listFocusContainers(): Promise<Array<{ name: string; cwd: string }>>`

### Requirement: Runtime factory selects adapter based on config
The system SHALL provide a `selectRuntime(runtime, cwd?)` factory function that returns a `RuntimeAdapter` instance, resolving `'auto'` to a concrete backend by probing the environment.

#### Scenario: auto selects Apple Containers on macOS when available
- **WHEN** `runtime` is `'auto'` and the process is running on macOS and the `container` binary responds to `container --version` with exit code 0
- **THEN** `selectRuntime` returns an `AppleContainersRuntimeAdapter`

#### Scenario: auto falls back to Docker when Apple Containers unavailable
- **WHEN** `runtime` is `'auto'` and the `container` binary is not found or returns a non-zero exit
- **THEN** `selectRuntime` returns a `DockerRuntimeAdapter`

#### Scenario: auto uses Docker on non-macOS platforms
- **WHEN** `runtime` is `'auto'` and the platform is not `darwin`
- **THEN** `selectRuntime` returns a `DockerRuntimeAdapter` without probing the `container` binary

#### Scenario: docker forces Docker adapter
- **WHEN** `runtime` is `'docker'`
- **THEN** `selectRuntime` returns a `DockerRuntimeAdapter` regardless of platform or binary availability

#### Scenario: apple-containers forces Apple Containers adapter
- **WHEN** `runtime` is `'apple-containers'`
- **THEN** `selectRuntime` returns an `AppleContainersRuntimeAdapter` without probing
