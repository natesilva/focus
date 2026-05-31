## Why

`focus` has no implementation yet. Phase 1 establishes the minimal working CLI so the core container-launch workflow can be exercised end-to-end before any configuration or profile complexity is introduced.

## What Changes

- New `focus` binary with `run`, `stop`, and `status` subcommands
- Docker-compatible runtime adapter (single backend for this phase)
- Hard-coded base image with a non-root user whose UID matches the host user
- Current working directory bind-mounted at `/focus` inside the container
- Interactive shell drop when launched without a command; non-interactive execution with `focus -- <cmd>`

## Capabilities

### New Capabilities

- `cli-entrypoint`: Top-level CLI with `focus`/`focus run`, `focus stop`, and `focus status` commands and `focus -- <cmd>` passthrough
- `docker-runtime`: Docker-compatible runtime adapter that starts, attaches to, stops, and inspects containers via the `docker` CLI
- `container-launch`: Launches a container with the current directory mounted at `/focus` under a non-root user matching the host UID

### Modified Capabilities

<!-- none — no existing specs -->

## Impact

- Introduces the `focus` binary (new project, no existing code)
- Runtime dependency: `docker` CLI must be present and pointing at a working context
- No config files, no volumes, no profiles in this phase — all hardcoded
