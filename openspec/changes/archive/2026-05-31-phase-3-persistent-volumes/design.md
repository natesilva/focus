## Context

Phases 1 and 2 give us a container that launches with the current directory at `/focus` and reads config from XDG paths. But every container restart discards tool state: Claude Code tokens, SSH keys, Git identity. Phase 3 adds a `VolumeManager` that owns the lifecycle of persistent host directories that get bind-mounted into the container alongside `/focus`.

The XDG volumes dir (`~/.local/share/focus/volumes/`) is already reserved by the `xdg-paths` spec; this phase populates it.

## Goals / Non-Goals

**Goals:**
- Define a fixed set of named volume slots (claude, ssh, git) with known host paths and container mount targets
- Create host directories on first use (idempotent; subsequent runs are a no-op)
- Set directory ownership to the host UID so the non-root container user can read/write
- Pass the resulting volume mounts to the Docker runtime adapter on container launch

**Non-Goals:**
- Dynamic volume registration (that belongs in Phase 4 tool profiles)
- Backup, export, or migration of volume contents
- Per-project volume overrides (config schema change deferred to Phase 4)
- Volume pruning or cleanup commands

## Decisions

### Decision: Host bind-mounts over Docker named volumes

**Chosen:** bind-mount host directories under `~/.local/share/focus/volumes/`  
**Alternative:** Docker named volumes (opaque volumes managed by the daemon)

Bind-mounts put the data at a predictable, user-visible path that Time Machine can back up and that the user can inspect or edit directly. Docker named volumes are opaque blobs tied to the daemon; they complicate backup and are harder to migrate between runtimes. The XDG spec already calls out this path, so bind-mounts are the natural fit.

### Decision: Hardcoded slot catalog in Phase 3

**Chosen:** A static array of `VolumeSlot` objects defined in `src/volumes.ts`  
**Alternative:** Read slot definitions from config or profile descriptors

Phase 4 will introduce dynamic profile-driven volumes. Adding a config-level extensibility hook now would be premature and would require spec work that belongs in that phase. The three slots (claude, ssh, git) cover the immediate use case; the catalog is trivially extended in Phase 4 by replacing the static array.

### Decision: `mkdir -p` + `chown` at launch time

**Chosen:** Create and chown the host directory each time `focus` launches (idempotent)  
**Alternative:** A one-time `focus init` step

Requiring an explicit init step creates a failure mode where a fresh machine skips it and gets a confusing bind-mount error. Creating directories at launch is a 2ms stat + mkdir; the cost is negligible and the UX is zero-friction.

### Decision: Git identity as read-only bind-mount of `~/.gitconfig`

**Chosen:** bind-mount `~/.gitconfig` (a single file, read-only) rather than a directory  
**Alternative:** Copy the host `.gitconfig` into a volume directory

Mounting the file directly keeps Git identity in sync with the host without duplication. Read-only prevents accidental modification inside the container. If the file does not exist on the host the mount is skipped silently to avoid a Docker error.

## Risks / Trade-offs

**Risk: UID mismatch on volume files created outside focus** → Mitigation: document that files manually dropped into volume directories must be owned by the host UID; no automated repair.

**Risk: `~/.gitconfig` absent on host** → Mitigation: check for file existence before adding to mount list; skip if missing.

**Risk: SSH key permissions** → Mitigation: `~/.ssh` is created with mode `0700`; SSH refuses to use keys with broader permissions, so the container user must not widen them. Document this constraint.

## Open Questions

None — scope is narrow enough that all decisions can be made now.
