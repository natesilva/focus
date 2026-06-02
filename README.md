# focus

`focus` launches an isolated container scoped to your current working directory. Drop into a reproducible, tool-configured environment for any project without giving the container access to the rest of your filesystem.

```shell
$ cd ~/dev/my-project
$ focus
[focus] /work/my-project     # now you’re in a container
$
```

---

## Why

AI coding tools are powerful — and capable of making sweeping, irreversible changes to your filesystem. Mistakes happen. Prompt injection attacks (malicious instructions embedded in code you've pulled from GitHub) are a real and growing threat.

The right answer is to run these tools in a container. In a container, your home directory, SSH keys, and other projects are simply not reachable. But setting up a container environment for each project is friction — so most developers skip it and accept the risk.

**`focus` makes the safe path the easy path.** One command, and you're in a container. No Dockerfile, no config. Your current directory is mounted; nothing else is exposed.

---

## Prerequisites

**macOS** — [Apple Containers](https://developer.apple.com/documentation/virtualization) (macOS 26 Tahoe or later, preferred) or any Docker-compatible runtime (Docker Desktop, OrbStack, Colima).

**Linux / WSL2** — Docker or Podman (in Docker-compatible mode via a Docker context).

---

## Installation

> **TBD** — distribution method not yet decided. In the meantime, clone and install from source:

```sh
git clone https://github.com/natesilva/focus
cd focus
npm install
npm install -g .
```

---

## Quickstart

```sh
cd ~/dev/my-project
focus
```

No config file required. `focus` builds a container image using your global defaults and drops you into a shell. Your project is at `/work/my-project` inside the container. Persistent tool config (Claude auth, SSH keys) is mounted from `~/.local/share/focus/volumes/` and carries over between runs.

When you exit, the container stops. Run `focus` again and it starts fresh instantly — the image is cached.

To pin a specific set of tools for a project, run `focus init` to scaffold a `.focus.yaml` and commit it.

---

## Commands

| Command | Description |
|---|---|
| `focus` | Start the container for the current directory |
| `focus run` | Same as `focus` (explicit form) |
| `focus -- <cmd> [args...]` | Run a command non-interactively; exit code is propagated |
| `focus stop` | Stop the container for the current directory |
| `focus status` | Show whether a container is running and whether config is current |
| `focus init` | Scaffold a `.focus.yaml` in the current directory |
| `focus --version` | Print the version and exit |

---

## Per-Project Configuration

A `.focus.yaml` at the project root declares the environment. Commit it to make the environment reproducible for everyone using focus. It's optional — focus runs with global defaults when no project config is present.

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

shell:
  prompt: two-line     # two-line | inline | false
```

| Field | Default | Description |
|---|---|---|
| `tools` | `[]` | Tool profiles to install (see catalog below) |
| `runtime` | `auto` | Container runtime to use |
| `network` | `bridge` | `none` disables all networking |
| `image` | `ubuntu:24.04` | Base image for tool installation |
| `shell.prompt` | `two-line` | Shell prompt style; `false` to disable |

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

## Tool Profile Catalog

Tool profiles are named sets of packages. Each declares what to install and which directories to persist across container runs.

| Profile | Installs | Persists |
|---|---|---|
| `git` | git | — |
| `ripgrep` | ripgrep | — |
| `ssh` | openssh-client | `~/.ssh` |
| `node` | Node.js 24, pnpm | — |
| `python` | Python 3, uv | — |
| `rust` | rustc, cargo | — |
| `claude-code` | Claude Code CLI | `~/.claude` |

`claude-code` depends on `node` — you don't need to list both; focus resolves prerequisites automatically.

---

## Custom Tool Profiles

Define custom tool profiles in `~/.config/focus/profiles/<name>.yaml`:

```yaml
# ~/.config/focus/profiles/openspec.yaml
prerequisites:
  - node
install:
  - npm install -g @fission-ai/openspec@latest
volumes: []
```

Then reference it by name in `.focus.yaml`:

```yaml
tools:
  - openspec
```

The `prerequisites` field ensures required profiles are installed first. `volumes` lists directory names to mirror between `~/.local/share/focus/volumes/` and the container's home directory.

---

## Persistent Volumes

| Host path | Container path | Purpose |
|---|---|---|
| Current directory | `/work/<dirname>` | Project files |
| `~/.local/share/focus/volumes/claude-code/.claude/` | `~/.claude` | Claude Code auth |
| `~/.local/share/focus/volumes/ssh/.ssh/` | `~/.ssh` | SSH keys |

Volume paths respect `$XDG_DATA_HOME`.

---

## XDG Paths

| Path | Purpose |
|---|---|
| `~/.config/focus/` | Config file, custom tool profiles |
| `~/.local/share/focus/volumes/` | Persistent tool volumes |
| `~/.cache/focus/` | Built image layer cache (safe to delete) |

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

## Documentation

Full documentation is in [`docs/`](docs/).

---

## License

MIT — see [LICENSE](LICENSE).
