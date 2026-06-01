# focus — Future Features

Ideas and capabilities worth revisiting once the core phases are complete. These are not committed to the roadmap; they're captured here so they aren't lost.

---

## Apple Containers: native SSH agent forwarding

**Context:** The `container` CLI (macOS 26+) provides a `--ssh` flag that automatically mounts the host SSH agent socket into the container and keeps the mount target updated across logins (i.e. it handles the case where `$SSH_AUTH_SOCK` changes after logout/login). This is functionally equivalent to:

```
-v "${SSH_AUTH_SOCK}:/run/host-services/ssh-auth.sock"
-e SSH_AUTH_SOCK=/run/host-services/ssh-auth.sock
```

but without hard-coding the socket path.

**Why not in Phase 6:** The `ssh` tool profile currently works by bind-mounting `~/.ssh` (the key files), not by forwarding the agent socket. Switching to `--ssh` would be a better default for interactive SSH use but requires:

1. Distinguishing between "SSH keys" (bind-mount of `~/.ssh`) and "SSH agent" (the `--ssh` flag) as separate profile concerns.
2. Making the `AppleContainersRuntimeAdapter` aware of which profiles are active so it can set `--ssh` on `container run` — or alternatively adding an `ssh` boolean to `StartOptions`.
3. Deciding whether to keep the `~/.ssh` bind-mount alongside `--ssh`, or replace it entirely.

**Suggested approach when revisiting:** Add `ssh: boolean` to `StartOptions`. The Docker adapter ignores it (or could also bind-mount the agent socket via a Docker-specific workaround). The Apple Containers adapter passes `--ssh` when true. The `ssh` profile sets `ssh: true` in its volume descriptor instead of adding an `~/.ssh` bind-mount.

---

## Tool definitions in YAML (instead of hardcoded)

**Context:** Built-in tool definitions (SSH, Claude, Rust, Node, etc.) are currently defined in source code. User-defined tools use a `.yaml` format for the same information.

**Suggested approach when revisiting:** Extract built-in tool definitions into `.yaml` files that use the same schema as user-defined tools. The loader would read both from a built-ins directory (bundled with the binary) and from user config paths. This would make it easier to add, modify, or override built-in tools without touching source code, and would allow advanced users to override a built-in by name.

---

## DevContainer Features as a tool-configuration mechanism

**Context:** The [DevContainer Features spec](https://containers.dev/implementors/features/) defines a standard, composable format for installing tools into containers — each Feature is a shell script with a `devcontainer-feature.json` manifest declaring options, dependencies, and install steps. There is a large community registry of Features.

**Suggested approach when revisiting:** Evaluate whether `focus` tool profiles could be backed by or translated to DevContainer Features. This could give access to the existing ecosystem of tool installers without maintaining them ourselves, and would make `focus` more familiar to developers already using devcontainers. The main concern is whether Features' install-time model fits `focus`'s image-layer caching strategy.

---

## Versioned tool deployment (e.g. `node@26`)

**Context:** Currently, tools are deployed at a fixed (usually latest) version. Users have no way to pin a specific version of a tool like Node.js or Rust from the `.focus.yaml` config.

**Suggested approach when revisiting:** Add optional version specifiers to tool references in `.focus.yaml` (e.g. `node@26`, `node@24.2.1`). The tool profile would receive the requested version and use it when installing — for example, by selecting a specific image tag, passing a version argument to a version manager (`mise`, `nvm`, etc.), or switching to a version-aware install script. Version pinning should be reflected in the image cache key so differently-versioned containers don't collide.

---

## tmux in the container

**Context:** When `focus shell` drops the user into a container, they get a bare shell. For longer-lived work sessions, tmux would allow multiple panes/windows, persistent sessions, and re-attachment.

**Suggested approach when revisiting:** Install tmux in the base image (or as a default tool profile) and optionally start the shell inside a tmux session. The default could be opt-in via a config flag (`shell.tmux: true`), or always-on but skippable with a flag. A default `.tmux.conf` should be included so that key bindings work predictably in the container without requiring the user to bring their own config.

---

## Branded shell prompt

**Context:** Inside the container, the shell prompt looks like any other shell — there is no visual indication that the user is inside a `focus` container. This makes it easy to lose track of context when switching between terminal tabs.

**Suggested approach when revisiting:** Set a default prompt in the container that is visually distinct: colorful, includes `[focus]` or the project name, and clearly signals that this is the focus environment. The prompt should be set in a shell init file (e.g. `/etc/bash_prompt.d/focus.sh` or equivalent for zsh) so it applies to all users and is easy to override in `.bashrc`/`.zshrc`. Consider including the mounted project directory name and the active tool profile set.

---

## Apple Containers: per-container resource limits

**Context:** `container run` accepts `--cpus` and `--memory` flags that set per-VM CPU and memory limits. Docker supports these too, but they're not currently surfaced in `.focus.yaml`.

**Suggested approach when revisiting:** Add optional `resources.cpus` and `resources.memory` fields to the project config schema and pass them through `StartOptions` to both adapters.
