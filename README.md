# focus

A CLI tool that launches an isolated container scoped to the current working directory.

```
$ cd ~/dev/myproject
$ focus
[focus] launching myproject...
dev@myproject:/focus $
```

## Overview

`focus` mounts only the current directory into the container — nothing else on the host filesystem is exposed. The container's tool set is declared in a per-project `.focus.yaml` and reproduced exactly on every run. Tool credentials and configuration (SSH keys, Claude Code auth, etc.) persist across runs via managed volumes.

Runs on macOS (Apple Containers or Docker-compatible) and Linux/WSL2 (Docker-compatible).

## Status

Early development. See [`docs/plan.md`](docs/plan.md) for the project plan.

## Documentation

- [Design](docs/design.md)
- [Project Plan](docs/plan.md)
