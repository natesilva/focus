# focus vs. Dev Containers

[Dev Containers](https://containers.dev) (the VS Code / GitHub Codespaces spec) and focus solve a similar problem — reproducible dev environments in containers — but they make different trade-offs.

| | focus | Dev Containers |
|---|---|---|
| **Editor coupling** | None — any editor, any terminal | Designed for VS Code (other tools have varying support) |
| **Config format** | Simple `tools:` list + YAML profiles | Full `devcontainer.json` with Dockerfile or image |
| **Scope** | One directory = one container | One workspace = one container |
| **Persistence** | Named volumes managed by focus | Managed by the Dev Container runtime |
| **Runtime** | Apple Containers, Docker, or any Docker context | Docker-compatible only |
| **Host filesystem exposure** | Current directory only, by design | Configurable, often broader |

**Use focus when** you want a fast, editor-agnostic way to drop into a clean environment without writing a Dockerfile or learning the Dev Container spec. It's especially well-suited for AI coding workflows (Claude Code runs great inside focus).

**Use Dev Containers when** you need deep VS Code integration, your team is already on the Dev Container spec, or you need the richer Dockerfile/docker-compose customization surface.
