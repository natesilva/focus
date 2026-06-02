# Getting Started

`focus` drops you into an isolated container scoped to your current directory. Your project files are there, your tools are there, and nothing else from your host system is exposed. It is, in a sense, exactly what it sounds like — which is refreshing, because most software is not.

---

## Prerequisites

### macOS

Install [Apple Containers](https://developer.apple.com/documentation/virtualization) (macOS 26 Tahoe or later, preferred) or a Docker-compatible runtime like [OrbStack](https://orbstack.dev) or Docker Desktop.

Apple Containers is the lightweight, native option — it does run a background service, but a remarkably restrained one. If you installed it via Homebrew (which you should), `brew services start container` gets it going. Activity Monitor will show it consuming whole megabytes of memory when idle, which is alarming only if you remember 1990. Docker Desktop works too. `focus` uses whatever runtime you have active and will not judge you for your choices, except silently.

### Linux / WSL2

Install Docker or Podman (in Docker-compatible mode via a Docker context). On WSL2, your project directory should be on the Linux filesystem for acceptable volume performance. Putting it on the Windows filesystem and then complaining about performance is a valid life choice, but not one `focus` can help with.

---

## Installation

> **TBD** — distribution method not yet decided (Homebrew, npm, or standalone binary). The good news is that we know `focus` works. The less good news is that we have not yet decided how to get it to you in a way that feels official. In the meantime:
>
> ```sh
> git clone https://github.com/natesilva/focus
> cd focus
> npm install
> npm install -g .
> ```
>
> Welcome to the early adopter experience. You're basically a test subject. We appreciate your participation.

---

## Quickstart

```sh
cd ~/dev/myproject
focus
```

That's it. `focus` builds a container image for your project and drops you into a shell. No config file required — it runs with your global defaults out of the box, which is either reassuring or unsettling depending on your relationship with defaults.

Inside the container, your project is at `/work/myproject` (the directory name from the host). Persistent tool config — Claude auth, SSH keys, Git identity — is mounted from `~/.local/share/focus/volumes/` and survives across container runs. You set up your credentials once. They follow you. Like a loyal assistant, or a persistent memory leak. One of those.

```
[focus] /work/myproject
$
```

Type `exit` or press `Ctrl-D` to leave. The container stops when your session ends. Next time you run `focus` in the same directory, it starts again instantly — `focus` caches the image after the first build so you're not waiting around while packages download again.

To declare a specific set of tools for a project, run `focus init` to scaffold a `.focus.yaml` and commit it to the repo. This makes the environment reproducible for your colleagues, assuming they also have `focus` installed, which is a reasonable thing to assume once you've told them about it.

---

## First steps inside

```sh
git status              # git is available if you listed it in .focus.yaml
rg "TODO" --type ts     # ripgrep, same idea
claude                  # Claude Code, if you added the claude-code profile
```

To run a command without entering an interactive shell — useful in scripts, or when you need the output but not the company:

```sh
focus -- rg "TODO" --type ts
```

---

## What's next

- [Configuration](configuration.md) — all config files, fields, and defaults, documented in a table format that implies more certainty than any of us should feel
- [Profiles](profiles.md) — tool profiles: what's built in and how to write your own
