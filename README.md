# focus

`focus` launches an isolated container scoped to your current working directory. Drop into a reproducible, tool-configured environment for any project without giving the container access to the rest of your filesystem.

```
$ cd ~/dev/myproject
$ focus
[focus] launching myproject...
focususer@focus-d1aa5787:/focus $
```

---

## Prerequisites

**macOS** — [Apple Containers](https://developer.apple.com/documentation/virtualization) (macOS 26 Tahoe or later, preferred) or any Docker-compatible runtime (Docker Desktop, OrbStack, Colima).

**Linux / WSL2** — Docker or Podman (in Docker-compatible mode via a Docker context).

---

## Installation

```sh
git clone https://github.com/natesilva/focus
cd focus
npm install
npm install -g .
```

---

## Quickstart

```sh
cd ~/dev/myproject
focus init          # scaffold a .focus.yaml
focus               # launch the container
```

Inside the container your project is at `/focus`. Persistent tool config (Claude auth, SSH keys, Git identity) is mounted from `~/.local/share/focus/volumes/` and survives across container runs.

---

## Commands

| Command | Description |
|---|---|
| `focus` | Start or attach to the container for the current directory |
| `focus run` | Same as `focus` (explicit form) |
| `focus -- <cmd> [args...]` | Run a command non-interactively; exit code is propagated |
| `focus stop` | Stop the container for the current directory |
| `focus status` | Show whether a container is running and whether config is current |
| `focus init` | Scaffold a `.focus.yaml` in the current directory |
| `focus --version` | Print the version and exit |

---

## Per-Project Configuration

A `.focus.yaml` at the project root declares the environment. Commit it to make the environment reproducible for everyone using focus.

```yaml
# .focus.yaml
tools:
  - git
  - ripgrep
  - node
  - claude-code

runtime: auto          # auto | docker | apple-containers
network: bridge        # bridge | none
image: ubuntu:24.04    # base image (optional override)
```

| Field | Default | Description |
|---|---|---|
| `tools` | `[]` | Profile names to install (see catalog below) |
| `runtime` | `auto` | Container runtime to use |
| `network` | `bridge` | `none` disables all networking |
| `image` | `ubuntu:24.04` | Base image for tool installation |

---

## Global Configuration

`~/.config/focus/config.yaml` holds user-level defaults. Per-project config overrides globals; CLI flags override both.

```yaml
# ~/.config/focus/config.yaml
runtime: auto
tools:
  - git
image: ubuntu:24.04
```

The config path respects `$XDG_CONFIG_HOME`.

---

## Profile Catalog

Profiles are named tool sets. Each profile declares what to install and which persistent volume slots it needs.

| Profile | Installs | Persists |
|---|---|---|
| `git` | git | — |
| `ripgrep` | ripgrep | — |
| `ssh` | openssh-client | `~/.ssh` |
| `node` | Node.js 24, pnpm | — |
| `python` | Python 3, uv | — |
| `rust` | rustc, cargo | — |
| `claude-code` | Node.js 24, Claude Code CLI | `~/.claude` |

---

## Custom Profiles

Define custom profiles in `~/.config/focus/profiles/<name>.yaml`:

```yaml
# ~/.config/focus/profiles/openspec.yaml
install:
  - npm install -g @fission-ai/openspec@latest
volumes: []
```

Then reference the profile by name in `.focus.yaml`:

```yaml
tools:
  - node
  - openspec
```

Profiles are applied in alphabetical order, so `node` always runs before `openspec`.

---

## Persistent Volumes

| Host path | Container path | Purpose |
|---|---|---|
| Current directory | `/focus` | Project files |
| `~/.local/share/focus/volumes/claude/` | `~/.claude` | Claude Code auth |
| `~/.local/share/focus/volumes/ssh/` | `~/.ssh` | SSH keys |
| `~/.gitconfig` (read-only) | `/etc/gitconfig` | Git identity |

Volume paths respect `$XDG_DATA_HOME`.

---

## XDG Paths

| Path | Purpose |
|---|---|
| `~/.config/focus/` | Config file, custom profiles |
| `~/.local/share/focus/volumes/` | Persistent tool volumes |
| `~/.cache/focus/` | Built image layer cache (safe to delete) |
| `~/.local/state/focus/` | Running container registry |

---

## Runtime Selection

| Value | Behavior |
|---|---|
| `auto` | Apple Containers on macOS if available, otherwise Docker-compatible |
| `docker` | Force Docker-compatible (uses active Docker context) |
| `apple-containers` | Force Apple Containers (macOS 26+ only) |

Podman integrates via Docker contexts — no special focus configuration needed.

---

## Examples

See [`examples/`](examples/) for sample `.focus.yaml` files for common project types.

---

## License

MIT — see [LICENSE](LICENSE).
