# Configuration

`focus` has two config files: a per-project one committed to the repo, and a global one for your user-level defaults. CLI flags override both. This is the correct and sensible layering of configuration authority, which is why we're pointing it out — correct and sensible things deserve acknowledgment.

**Precedence: global → project → CLI flags**

---

## Per-project: `.focus.yaml`

Drop this file at the root of your project and commit it. It makes the environment reproducible for anyone using `focus`, including future-you, who will have forgotten everything about this project and will be grateful that past-you was so organized.

```yaml
# .focus.yaml
tools:
  - git
  - ripgrep
  - node
  - claude-code

runtime: auto          # auto | docker | apple-containers
network: bridge        # bridge | none
image: ubuntu:24.04    # base image override (optional)

shell:
  prompt: two-line     # two-line | inline | false
```

| Field | Default | Description |
|---|---|---|
| `tools` | `[]` | Profile names to install (see [Profiles](profiles.md)) |
| `runtime` | `auto` | Runtime backend: `auto`, `docker`, or `apple-containers` |
| `network` | `bridge` | `none` disables all networking (air-gapped) |
| `image` | `ubuntu:24.04` | Base container image |
| `shell.prompt` | `two-line` | Shell prompt style; `false` to disable entirely |

---

## Global: `~/.config/focus/config.yaml`

User-level defaults applied to every project. Per-project config overrides these fields when set. Think of this as the settings you'd rather not explain to every new repo you clone.

```yaml
# ~/.config/focus/config.yaml
runtime: auto
tools:
  - git
image: ubuntu:24.04
```

The path respects `$XDG_CONFIG_HOME` — if that variable is set, `focus` looks for the config at `$XDG_CONFIG_HOME/focus/config.yaml`. If you don't know what `$XDG_CONFIG_HOME` is, it almost certainly isn't set, and you can stop reading this sentence.

---

## XDG paths

`focus` follows the [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/latest/), which is a formal document that tells software where to put its files so they're not all in your home directory. All paths respect their corresponding `$XDG_*` variable if set.

| Path | XDG variable | Purpose |
|---|---|---|
| `~/.config/focus/` | `$XDG_CONFIG_HOME` | `config.yaml`, custom tool profiles |
| `~/.local/share/focus/volumes/` | `$XDG_DATA_HOME` | Persistent tool volumes (auth, SSH keys, etc.) |
| `~/.cache/focus/` | `$XDG_CACHE_HOME` | Built image layer cache — safe to delete |
| `~/.local/state/focus/` | `$XDG_STATE_HOME` | Currently unused (it's just sitting there, waiting) |

---

## Runtime selection

| Value | Behavior |
|---|---|
| `auto` | Apple Containers on macOS if available; otherwise Docker-compatible |
| `docker` | Force Docker-compatible (uses the active Docker context) |
| `apple-containers` | Force Apple Containers (macOS 26+ only) |

Podman integrates via Docker contexts — no special `focus` configuration needed. Set Podman as your active Docker context and `runtime: docker` (or `auto`) works as expected. This is a reasonable thing to do and `focus` will not ask any follow-up questions about it.
