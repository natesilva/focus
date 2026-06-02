## Context

The entrypoint script injects a custom PS1 into `/etc/bash.bashrc` before starting the user shell. Bash sources `/etc/bash.bashrc` first, then `~/.bashrc`, so any PS1 set in `~/.bashrc` wins.

When a project has profile volumes (e.g. `.claude`), Docker pre-creates `/home/focususer` as a mount-point parent before the entrypoint runs. `useradd -m` then finds the directory already present and skips skel file copying — so `~/.bashrc` never appears and the focus prompt survives.

When a project has no profile volumes, Docker never pre-creates the home directory. `useradd -m` creates it from scratch, copying `/etc/skel` including `.bashrc`. That `.bashrc` sets PS1, overriding the focus prompt in `/etc/bash.bashrc`.

## Goals / Non-Goals

**Goals:**
- Custom PS1 takes effect for all projects, with or without profile volumes.
- Existing `shell.prompt: false` opt-out continues to work.
- No duplicate prompt block is appended across container restarts.

**Non-Goals:**
- Preserving a custom PS1 set inside a user-mounted `~/.bashrc`. Users who want full prompt control should set `shell.prompt: false`.
- Changing prompt content, styles, or configuration schema.

## Decisions

**Write to `$ACTUAL_HOME/.bashrc` instead of `/etc/bash.bashrc`.**

Since bash sources `~/.bashrc` last, appending there guarantees the focus PS1 wins over any skel-generated PS1. The `# focus-prompt` guard (`grep -q`) is moved to the same target file, so the idempotency check stays consistent.

*Alternative considered*: Write to both files. Rejected — writing to `/etc/bash.bashrc` is now unnecessary and leaves a stale write with no effect.

*Alternative considered*: Detect whether `~/.bashrc` already sets PS1 and skip in that case. Rejected — reliably parsing arbitrary shell scripts is fragile; `shell.prompt: false` is the explicit opt-out.

`$ACTUAL_HOME` is already computed before the prompt block in the entrypoint (`getent passwd` after `useradd`), so it is available without any new shell logic.

## Risks / Trade-offs

- **Persistent `~/.bashrc` volume**: A profile that mounts a custom `~/.bashrc` containing a PS1 will have the focus PS1 appended on first container start. On subsequent starts the guard prevents re-appending. Mitigation: `shell.prompt: false` is the documented escape hatch.
- **`~/.bashrc` missing in edge-case images**: If `$ACTUAL_HOME/.bashrc` doesn't exist, `cat >>` creates it — safe and consistent with how the old `/etc/bash.bashrc` append worked.
