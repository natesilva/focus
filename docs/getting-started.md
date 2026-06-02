# Getting Started

`focus` drops you into an isolated container scoped to your current directory. Your project files are there, your tools are there, and nothing else from your host system is exposed.

---

## Prerequisites

### macOS

Install [Apple Containers](https://developer.apple.com/documentation/virtualization) (macOS 26 Tahoe or later, preferred) or a Docker-compatible runtime like [OrbStack](https://orbstack.dev) or Docker Desktop.

Apple Containers is the lightweight, native option. Docker Desktop works too — focus uses whatever runtime you have active.

### Linux / WSL2

Install Docker or Podman (in Docker-compatible mode via a Docker context). On WSL2, your project directory should be on the Linux filesystem for acceptable volume performance.

---

## Installation

> **TBD** — distribution method not yet decided (Homebrew, npm, or standalone binary). Check back soon or clone the repo directly:
>
> ```sh
> git clone https://github.com/natesilva/focus
> cd focus
> npm install
> npm install -g .
> ```

---

## Quickstart

```sh
cd ~/dev/myproject
focus
```

That's it. `focus` builds a container image and drops you into a shell. No config file required — it runs with your global defaults out of the box.

Inside the container, your project is at `/work/myproject` (the directory name from the host). Persistent tool config — Claude auth, SSH keys, Git identity — is mounted from `~/.local/share/focus/volumes/` and survives across container runs.

```
[focus] launching myproject...
focususer@focus-d1aa5787:/work/myproject $
```

Type `exit` or press `Ctrl-D` to leave. The container stops when your session ends. Next time you run `focus` in the same directory it starts again instantly.

To declare a specific set of tools for a project, run `focus init` to scaffold a `.focus.yaml` and commit it to the repo.

---

## First steps inside

```sh
git status              # git is available if you listed it in .focus.yaml
rg "TODO" --type ts     # ripgrep, same idea
claude                  # Claude Code, if you added the claude-code profile
```

To run a command without entering an interactive shell:

```sh
focus -- rg "TODO" --type ts
```

---

## What's next

- [Configuration](configuration.md) — all config files, fields, and defaults
- [Profiles](profiles.md) — tool profiles: what's built in and how to write your own
