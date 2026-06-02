# focus vs. Dev Containers

[Dev Containers](https://containers.dev) (the VS Code / GitHub Codespaces spec) and `focus` solve a similar problem — reproducible dev environments in containers — but they make different trade-offs. This comparison is fair and accurate. It is also written by the `focus` documentation, so you should factor that in.

| | `focus` | Dev Containers |
|---|---|---|
| **Editor coupling** | None — any editor, any terminal | Designed for VS Code (other tools have varying support) |
| **Config format** | Simple `tools:` list + YAML profiles | Full `devcontainer.json` with Dockerfile or image |
| **Scope** | One directory = one container | One workspace = one container |
| **Persistence** | Named volumes managed by `focus` | Managed by the Dev Container runtime |
| **Runtime** | Apple Containers, Docker, or any Docker context | Docker-compatible only |
| **Host filesystem exposure** | Current directory only, by design | Configurable, often broader |

**Use `focus` when** you want a fast, editor-agnostic way to drop into a clean environment without writing a Dockerfile or reading the Dev Container specification, which is long and contains several sections that will make you feel like you've made choices you can't unmake. `focus` is especially well-suited for AI coding workflows — Claude Code runs great inside `focus`, which is also how `focus` was built, which is either a compelling endorsement or a worrying closed loop depending on your perspective.

**Use Dev Containers when** you need deep VS Code integration, your team is already on the Dev Container spec, or you need the richer Dockerfile/docker-compose customization surface. Dev Containers are a serious, well-supported standard with a large ecosystem. We respect them. We just didn't want to write a `devcontainer.json` every time we started a new project.
