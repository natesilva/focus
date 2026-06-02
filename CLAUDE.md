# focus — Claude Instructions

## Project

`focus` is a CLI tool that launches an isolated container scoped to the current working directory. See [`docs/design.md`](docs/design.md) for the full design and [`docs/plan.md`](docs/plan.md) for the build plan.

## Key Design Decisions

- The current directory is mounted at `/work/<dirname>` inside the container, with a per-project workspace volume at `/work`. (`/workspace` was rejected — overloaded in monorepo tooling; `/focus` was the previous choice but caused prompt redundancy.)
- Persistent tool config (SSH keys, Claude auth, etc.) lives in XDG data volumes (`~/.local/share/focus/volumes/`), not inside the project directory.
- Container runs as a non-root user whose UID matches the host user to avoid bind-mount permission issues on Linux.
- Two runtime backends: Docker-compatible (default, uses active Docker context) and Apple Containers (preferred on macOS when available).
- No separate Podman backend — Podman integrates via Docker contexts like any other Docker-compatible runtime.

## XDG Paths

| Path | Purpose |
|---|---|
| `~/.config/focus/` | Config, custom profiles |
| `~/.local/share/focus/volumes/` | Persistent tool volumes |
| `~/.cache/focus/` | Image layer cache |
| `~/.local/state/focus/` | Running container registry |

## Commit Style

Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, etc.).
