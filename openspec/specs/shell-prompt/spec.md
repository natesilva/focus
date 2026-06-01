# Shell Prompt

## Purpose

Defines the branded bash prompt that the entrypoint script injects into interactive container sessions to identify the focus environment and project name.

## Requirements

### Requirement: Inject branded prompt into interactive bash sessions
When starting a container for an interactive shell session, the system SHALL inject a styled bash prompt that identifies the focus environment and project name. The prompt SHALL be written to `/etc/bash.bashrc` by the entrypoint script before the user process starts.

#### Scenario: Default prompt (two-line style)
- **WHEN** the container starts with no `shell.prompt` config or `shell.prompt: true`
- **THEN** `/etc/bash.bashrc` contains a PS1 that displays `[focus · <project>]` in bold green, the current working directory in blue, and the `$` prompt on a new line

#### Scenario: Inline style
- **WHEN** the container starts with `shell.prompt: { style: "inline" }`
- **THEN** `/etc/bash.bashrc` contains a PS1 that displays `[focus · <project>]` in bold green, the current working directory in blue, and `$` all on a single line

#### Scenario: Prompt disabled
- **WHEN** the container starts with `shell.prompt: false`
- **THEN** the entrypoint does NOT write a focus PS1 to `/etc/bash.bashrc`, leaving the base image default prompt intact

#### Scenario: Project name in prompt
- **WHEN** the container starts for a project directory named `api-server`
- **THEN** the injected prompt displays `[focus · api-server]`

#### Scenario: Non-interactive run is unaffected
- **WHEN** the user runs `focus -- <cmd>` (non-interactive command passthrough)
- **THEN** the prompt injection has no visible effect (PS1 is not evaluated in non-interactive shells)

#### Scenario: Idempotent injection
- **WHEN** the container is stopped and restarted without rebuilding
- **THEN** the entrypoint does not append a duplicate focus prompt block to `/etc/bash.bashrc`

#### Scenario: User dotfile override
- **WHEN** a user's `~/.bashrc` sets its own `PS1` after `/etc/bash.bashrc` is sourced
- **THEN** the user's PS1 takes effect (natural bash sourcing order: `/etc/bash.bashrc` first, `~/.bashrc` second)
