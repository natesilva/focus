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

## Docker socket forwarding (docker-in-focus)

**Context:** Some tools (e.g. build pipelines, container-aware CLIs) need access to a Docker daemon from inside the container. The host Docker socket can be forwarded by resolving the active context's endpoint and bind-mounting it:

```
$(docker context inspect --format '{{.Endpoints.docker.Host}}' | sed 's|unix://||'):/var/run/docker.sock
```

**Suggested approach when revisiting:** Add a `docker` tool profile (or a `docker: true` flag in `.focus.yaml`) that resolves the active Docker context endpoint at container start time and adds the socket bind-mount to `StartOptions`. Both the Docker and Apple Containers adapters support socket bind-mounts via `--volume`, so no adapter-specific handling is needed. Mount the socket read-write only; do not set `DOCKER_HOST` unless the in-container path differs from the standard `/var/run/docker.sock`.

---

## Prerequisites key for tool profiles

**Context:** Some tools depend on others being installed first. For example, the `claude-code` profile requires Node.js to be present before its install script can run, but there is currently no way to declare this dependency — the install order is implicit and fragile.

**Suggested approach when revisiting:** Add an optional `prerequisites` list to the tool profile schema. Before installing a tool, the image builder resolves the full prerequisite graph and installs dependencies in topological order. If a declared prerequisite is not in the active tool set, the builder adds it automatically (or warns, depending on desired behavior). This replaces implicit ordering assumptions with an explicit, checkable contract.

---

## Pre-create XDG config directory tree on first run

**Context:** `~/.config/focus/` and its subdirectories (e.g. the directory for custom tool profiles) are not created during installation or first run. Users who want to add a custom tool profile must manually create the directory tree before placing a `.yaml` file there.

**Suggested approach when revisiting:** On startup (or during a dedicated init step), ensure the full XDG directory tree exists: `~/.config/focus/`, `~/.local/share/focus/volumes/`, `~/.cache/focus/`, and `~/.local/state/focus/`. Use `fs.mkdir` with `{ recursive: true }` so the call is idempotent and safe to run on every invocation.

---

## Volume mount scoping

**Context:** All persistent tool volumes currently use the same sharing model: a named volume under `~/.local/share/focus/volumes/` that is shared across every `focus` instance regardless of working directory. This is appropriate for truly global state (e.g. Claude Code auth and configuration, which you want identical everywhere), but it is wrong for state that should vary per project, and it is the wrong mechanism entirely for resources that need to be readable by the host (e.g. SSH keys, Git config).

Three meaningful scopes exist:

| Scope | Volume backing | Use case |
|---|---|---|
| `global` (default) | Single named volume, shared by all `focus` instances | Claude Code config, shell history, editor settings |
| `project` | Named volume keyed to the resolved path of the mounted directory | Per-project node_modules caches, project-specific credentials |
| `host` | Bind-mount of the corresponding host path | SSH keys (`~/.ssh`), Git config (`~/.gitconfig`), GPG keys |

The word "scope" is better than "sharing level" for this concept.

**Suggested approach when revisiting:** Add an optional `scope` field to the volume descriptor type (currently only used internally by tool profiles). The image builder and `StartOptions` assembler use `scope` to decide whether to create/reuse a global named volume, create/reuse a per-project named volume (whose name is derived from a hash of the resolved host path), or emit a bind-mount. Default to `global` so existing behavior is unchanged. The `ssh` and `git` built-in profiles should switch to `scope: host`. Project-scoped volumes need a cleanup story — stale project volumes should be prunable with something like `focus volumes prune`.

---

## Apple Containers: per-container resource limits

**Context:** `container run` accepts `--cpus` and `--memory` flags that set per-VM CPU and memory limits. Docker supports these too, but they're not currently surfaced in `.focus.yaml`.

**Suggested approach when revisiting:** Add optional `resources.cpus` and `resources.memory` fields to the project config schema and pass them through `StartOptions` to both adapters.

---

## `focus images` — list focus-built images

**Context:** There is currently no way to see which container images `focus` has built on the host. Users have to inspect raw Docker/Apple Containers image lists and mentally filter for images tagged with the `focus-built` label, which is tedious and error-prone.

**Suggested approach when revisiting:** Add a `focus images` (or `focus image ls`) subcommand that queries the active runtime for all images carrying the `focus-built` label and prints them in a human-readable table (columns: image ID, project path, tool set, size, created). Both adapters already have access to the runtime client needed to issue this query. A `--json` flag for machine-readable output would be useful for scripting.

---

## `focus prune` — remove stale focus-built images

**Context:** Every time the tool set or base image changes, `focus` builds a new image and leaves the old one behind. Over time this accumulates significant disk space with no automated cleanup.

**Suggested approach when revisiting:** Add a `focus prune` subcommand that removes `focus-built` images that are no longer referenced by a running or stopped container. Optionally accept `--older-than <duration>` and `--project <path>` filters to narrow the scope. Print a dry-run summary by default and require `--confirm` (or `-y`) to actually delete, matching the UX of `docker image prune`. The implementation should go through the runtime adapter interface so it works with both Docker and Apple Containers backends.

---

## Mount CWD at `/focus/<dirname>` for worktree support and per-project harness isolation

**Context:** The CWD is currently mounted at `/focus` regardless of the project name. This has two consequences:

1. **No room for sibling worktrees.** Tools like Claude Code create git worktrees as siblings of the repo root (e.g. `../api-server-feature-x`). With the project at `/focus`, siblings would land outside `/focus` in an unmanaged part of the container filesystem.

2. **All projects share the same harness settings path.** Claude Code and similar tools store per-project settings (allowed tools, model preferences, etc.) keyed to the working directory path. Since every project mounts at `/focus`, they all accumulate settings under the same key, defeating per-project isolation.

Mounting the CWD at `/focus/<dirname>` instead (e.g. `~/dev/api-server` → `/focus/api-server`) fixes both: siblings land under `/focus/`, and each project has a distinct path that harnesses can use as a unique settings key.

**Worktree persistence via nested mounts:**

A symlink from `/focus/api-server` to the bind-mounted project path does not work — git resolves symlinks to their physical path via `realpath()`, so relative worktree creation (e.g. `git worktree add ../feature-x`) would resolve against the physical mount path and miss the `/focus/` namespace entirely. Hardlinks are impossible across different mount points.

The approach that works is nested mounts:

```
-v focus-vol-<project-hash>:/focus          # per-project named volume, persists across restarts
-v ~/dev/api-server:/focus/api-server       # bind mount, layered on top
```

Linux VFS handles nested mounts correctly. `/focus/api-server` is a real directory (not a symlink), so `pwd` and git agree on the path. Worktrees created at `/focus/api-server-feature-x` live in the named volume and survive container restarts. The `.git/worktrees/` metadata inside the bind-mounted repo also persists, so paths remain consistent.

The named volume must be keyed per-project (e.g. by a hash of the resolved host path) to prevent worktrees from different projects accumulating in a shared volume.

**Concerns to resolve before implementing:**

- **Mount ordering:** the named volume must be declared before the nested bind mount; verify both adapters handle this correctly.
- **Apple Containers:** nested mount support is less tested in this runtime than Docker — needs verification.
- **Stale worktree cleanup:** worktrees from abandoned work accumulate in the named volume. Run `git worktree prune` automatically on container start, and ensure `focus prune` can also remove stale per-project volumes.
- **Persistence necessity:** for short-lived agent tasks (spin up worktree, commit, discard), ephemerality is acceptable and startup pruning handles stale `.git/worktrees/` metadata. Persistence is only needed for long-lived parallel workstreams that must survive `focus stop`/`focus start` cycles. Evaluate whether this use case justifies the added complexity before implementing.
