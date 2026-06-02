## Why

When a project has no profile volumes, `useradd -m` creates the container user's home directory fresh and copies `/etc/skel` — including a `.bashrc` that sets PS1. Because bash sources `~/.bashrc` after `/etc/bash.bashrc`, the skel PS1 overrides the custom focus prompt, leaving users with the default bash prompt instead of `[focus] /work/<project>`.

## What Changes

- The entrypoint writes the custom PS1 to `$ACTUAL_HOME/.bashrc` instead of `/etc/bash.bashrc`, so it is appended after any skel content and takes effect last.
- The `# focus-prompt` guard is checked and written against `$ACTUAL_HOME/.bashrc` instead of `/etc/bash.bashrc`.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `shell-prompt`: The mechanism for injecting the custom PS1 changes from `/etc/bash.bashrc` to `$ACTUAL_HOME/.bashrc`.

## Impact

- `src/entrypoint.sh`: two references to `/etc/bash.bashrc` change to `"$ACTUAL_HOME/.bashrc"`.
- No config, API, or profile changes.
- No breaking changes.
