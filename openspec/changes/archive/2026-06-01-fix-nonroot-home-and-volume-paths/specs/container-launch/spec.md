## ADDED Requirements

### Requirement: Container user owns its home directory
The container entrypoint SHALL ensure the non-root container user owns its home directory so that tools can create dotfiles and lock files directly in `$HOME`. Because the runtime pre-creates the home directory as root in order to host bind-mounted volume subdirs (e.g. `~/.claude`), `useradd -m` finds the directory already present and does not take ownership; the entrypoint MUST therefore chown the home directory to the host UID. The chown SHALL NOT be recursive, so bind-mounted volume subdirectories retain their own ownership.

#### Scenario: Home directory writable by the container user
- **WHEN** a container is launched and the container process runs as the non-root user
- **THEN** the user's home directory is owned by that user's UID and the user can create a new file directly in `$HOME`

#### Scenario: Dotfile written in home succeeds
- **WHEN** a tool running as the container user writes a dotfile directly in `$HOME` (e.g. Claude Code writing `~/.claude.json`)
- **THEN** the write succeeds rather than failing or blocking on a permission-denied home directory

#### Scenario: Mounted volume ownership preserved
- **WHEN** the entrypoint takes ownership of the home directory
- **THEN** a bind-mounted volume subdirectory under the home (e.g. `~/.claude`) retains its existing ownership and is not recursively chowned
