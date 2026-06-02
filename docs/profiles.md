# Tool Profiles

A tool profile is a named set of packages and configuration. You declare which tool profiles a project needs in `.focus.yaml`; `focus` installs them into the container image when it builds. The resulting environment contains exactly what you asked for, which is either liberating or alarming depending on how you feel about specificity.

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

"Persists" means the profile mounts a volume from `~/.local/share/focus/volumes/` at that path inside the container. The volume is created once on first use and shared across all `focus` containers, so your SSH keys and Claude auth follow you everywhere without re-setup. You authenticate once. The credentials persist. This is the promise. We have kept it.

`claude-code` depends on `node` — you don't need to list both; `focus` resolves prerequisites automatically. It will not send you a passive-aggressive note about it. It will simply do it. This is the best kind of software behavior.

---

## Custom tool profiles

Put a YAML file in `~/.config/focus/profiles/<name>.yaml`. Reference it by name in `.focus.yaml` just like a built-in. This is how you tell `focus` about tools it doesn't know about yet, which is most tools, because the world contains a frankly unreasonable number of them.

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

The `prerequisites` field lists other tool profiles that must be installed first. The `install` field is a list of shell commands run as root during the image build — these commands have access to the internet and no particular sense of restraint, so write them carefully. The `volumes` field lists directory names to mirror between `~/.local/share/focus/volumes/` and the container's home directory. Use `[]` if the profile needs no persistence.

---

## Overriding a built-in tool profile

A custom tool profile with the same name as a built-in replaces it entirely. Place the override in `~/.config/focus/profiles/<name>.yaml` and it takes precedence. This is useful if you want, say, a different version of Node.js, or if you have strong opinions about the built-in profile and the confidence to act on them.
