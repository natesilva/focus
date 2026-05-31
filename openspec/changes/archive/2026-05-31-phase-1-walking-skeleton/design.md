## Context

`focus` is a new project with no existing code. Phase 1 must deliver the minimal end-to-end path: user types `focus` in a project directory, a Docker container starts with that directory mounted at `/focus`, and a shell appears. Everything is hardcoded — no config files, no profiles, no volume management.

The project is a Node.js CLI written in TypeScript, running natively under Node.js 24 (type stripping, no build step). The `docker` CLI is the only runtime dependency.

## Goals / Non-Goals

**Goals:**
- Runnable `focus` binary with `run`, `stop`, and `status` subcommands
- Docker runtime adapter sufficient for Phase 1 (start, attach, stop, inspect)
- Current directory mounted at `/focus` with a non-root user matching host UID
- Interactive shell on `focus run`; command passthrough via `focus -- <cmd>`

**Non-Goals:**
- Config file parsing (Phase 2)
- Persistent volumes (Phase 3)
- Tool profiles or image building (Phase 4)
- Container identity / reattach (Phase 5)
- Apple Containers backend (Phase 6)
- Error message polish (Phase 7)

## Decisions

### Use `docker run` directly rather than the Docker Engine API

`docker run` handles TTY allocation, signal forwarding, and stdin attachment correctly with minimal code. The Docker Engine API requires reimplementing all of that. The runtime adapter will wrap CLI invocations, which is sufficient for Phase 1 and can be refactored later if needed.

Alternatives considered: Docker Engine REST API via `node:http` — rejected because TTY handling is complex and not needed yet.

### Single hardcoded base image: `ubuntu:24.04`

Ubuntu LTS is a known-good base with a standard package manager. The image choice is not exposed in Phase 1, so any well-maintained base works. `ubuntu:24.04` is chosen over Debian slim because it is more familiar and has slightly better out-of-box tooling for shell use.

### Non-root user created at container start via an entrypoint script

The host UID is passed into the container. A minimal entrypoint script creates the user on first launch if it does not exist, then execs the shell. This avoids baking a specific UID into the image and handles the common case where the host user is not UID 1000.

Alternatives considered: `--user $(id -u):$(id -g)` with no shell setup — rejected because shells need a home directory and named user entry for a usable environment.

### Container name derived from the absolute project directory path

`focus-<hash(cwd)>` gives a stable, predictable container name without storing state. In Phase 1, `focus stop` and `focus status` use this name to find the container.

The hash is a short (8-char) hex digest of the absolute path so names are human-readable length. Collision probability is negligible for a personal tool.

### TypeScript project structure

```
src/
  cli.ts          # CLI entry point, command routing
  runtime/
    docker.ts     # Docker runtime adapter
  container.ts    # Container launch / stop / status logic
  uid.ts          # Host UID resolution
```

`package.json` declares `"type": "module"` and a `bin` entry pointing to `src/cli.ts`. No compilation; Node.js runs TypeScript directly.

## Risks / Trade-offs

- **TTY detection** — `docker run -it` requires an allocated PTY. If `focus` is run in a non-TTY context (e.g. piped), `-it` must be dropped to `-i`. Mitigation: check `process.stdin.isTTY` and adjust flags accordingly.
- **docker CLI availability** — Phase 1 gives no friendly error if Docker is not installed. Mitigation: accept this as a known limitation; polished errors are Phase 7 scope.
- **Container already running** — Phase 1 does not reattach; it will attempt to start a second container with the same name and fail. Mitigation: `focus status` lets the user see state; attach logic is Phase 5 scope.
