# Tool Profiles

A tool profile is a named set of packages and configuration. You declare which tool profiles a project needs in `.focus.yaml`; focus installs them into the container image when it builds.

---

## Built-in tool profiles

| Profile | Installs | Persists |
|---|---|---|
| `git` | git | — |
| `ripgrep` | ripgrep | — |
| `ssh` | openssh-client | `~/.ssh` |
| `node` | Node.js 24, pnpm | — |
| `python` | Python 3, uv | — |
| `rust` | rustc, cargo | — |
| `claude-code` | Claude Code CLI | `~/.claude` |

"Persists" means the profile mounts a volume from `~/.local/share/focus/volumes/` at that path. The volume is created once on first use and shared across all focus containers, so your SSH keys and Claude auth follow you everywhere without re-setup.

`claude-code` depends on `node` — you don't need to list both; focus resolves prerequisites automatically.

---

## Custom tool profiles

Put a YAML file in `~/.config/focus/profiles/<name>.yaml`. Reference it by name in `.focus.yaml` just like a built-in.

```yaml
# ~/.config/focus/profiles/openspec.yaml
prerequisites:
  - node
install:
  - npm install -g @fission-ai/openspec@latest
volumes: []
```

```yaml
# .focus.yaml
tools:
  - openspec     # node is pulled in automatically via prerequisites
```

The `prerequisites` field lists other tool profiles that must be installed first. The `install` field is a list of shell commands run as root during the image build. The `volumes` field lists directory names to mirror between `~/.local/share/focus/volumes/` and the container's home directory (use `[]` if the profile needs no persistence).

---

## Overriding a built-in tool profile

A custom tool profile with the same name as a built-in replaces it. Place the override in `~/.config/focus/profiles/<name>.yaml` and it takes precedence.
