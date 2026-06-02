## MODIFIED Requirements

### Requirement: Inject branded prompt into interactive bash sessions
When starting a container for an interactive shell session, the system SHALL inject a styled bash prompt that identifies the focus environment. The prompt SHALL be written to `$ACTUAL_HOME/.bashrc` by the entrypoint script before the user process starts, ensuring the focus PS1 is sourced last and takes effect regardless of skel-generated overrides.

#### Scenario: Default prompt (two-line style)
- **WHEN** the container starts with no `shell.prompt` config or `shell.prompt: true`
- **THEN** `$ACTUAL_HOME/.bashrc` contains a PS1 that displays `[focus]` in bold green, the current working directory in blue, and the `$` prompt on a new line

#### Scenario: Inline style
- **WHEN** the container starts with `shell.prompt: { style: "inline" }`
- **THEN** `$ACTUAL_HOME/.bashrc` contains a PS1 that displays `[focus]` in bold green, the current working directory in blue, and `$` all on a single line

#### Scenario: Prompt disabled
- **WHEN** the container starts with `shell.prompt: false`
- **THEN** the entrypoint does NOT write a focus PS1 to `$ACTUAL_HOME/.bashrc`, leaving the base image default prompt intact

#### Scenario: Prompt at project root
- **WHEN** the container starts for a project directory named `api-server`
- **THEN** the injected prompt displays `[focus] /work/api-server` (the working directory reflects the `/work/<dirname>` mount path)

#### Scenario: Non-interactive run is unaffected
- **WHEN** the user runs `focus -- <cmd>` (non-interactive command passthrough)
- **THEN** the prompt injection has no visible effect (PS1 is not evaluated in non-interactive shells)

#### Scenario: Idempotent injection
- **WHEN** the container is stopped and restarted without rebuilding
- **THEN** the entrypoint does not append a duplicate focus prompt block to `$ACTUAL_HOME/.bashrc`

#### Scenario: Prompt active with no profile volumes
- **WHEN** a project has no tool profiles (no volumes pre-create the home directory) and `useradd -m` copies skel including a `~/.bashrc` with a default PS1
- **THEN** the focus PS1 is appended after the skel content and takes effect, displaying `[focus] /work/<project>`

#### Scenario: Skel override opt-out
- **WHEN** a user wants to preserve a custom PS1 from a mounted `~/.bashrc`
- **THEN** they set `shell.prompt: false` in `.focus.yaml` and the entrypoint writes nothing, leaving their PS1 intact
