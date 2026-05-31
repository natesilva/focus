## Context

The current implementation always launches a new container via `docker run --rm`, so every `focus` invocation starts fresh. There is no mechanism to detect an already-running container or handle the case where configuration has changed since the container started. `focus stop` and `focus status` are wired in the CLI but operate only on the container name (derived from `cwd`) with no config-awareness.

Phase 5 adds attach-or-launch logic, config-change detection, and orphan cleanup. The key architectural question is where to store per-container identity state.

## Goals / Non-Goals

**Goals:**
- Attach to an already-running container instead of spawning a duplicate
- Detect when the running container's tool config differs from the current resolved config and offer a rebuild
- Implement `focus stop` with clean teardown and `focus status` with identity-aware output
- Prune orphaned containers (stopped or whose working directory no longer exists) on launch

**Non-Goals:**
- Multiple simultaneous containers per directory
- Persistent shell history or session state inside containers
- Registry shared across multiple host users
- Any changes to the Apple Containers backend (Phase 6)

## Decisions

### Decision 1: Store identity in Docker labels, not a registry file

**Choice**: Pass `--label focus.config-hash=<hash>` (and `--label focus.cwd=<cwd>`) to `docker run`. Read them back with `docker inspect` when checking identity.

**Rationale**: Docker already tracks container metadata. Labels are attached to the container object and disappear automatically when the container is removed. A separate registry file would need manual sync — entries go stale whenever a container is killed externally (host reboot, `docker kill`, OOM). Labels are authoritative by construction.

**Alternative considered**: JSON registry at `~/.local/state/focus/registry.json`. Rejected because it requires a reconciliation step and adds failure modes (file locked, corrupted, out of sync).

### Decision 2: Attach via `docker exec`, not `docker start`

**Choice**: When a container with the correct identity is already running, use `docker exec --user <uid> [-it] <name> /bin/bash` (or the passthrough command).

**Rationale**: The container was started with `docker run --rm`, so it cannot be restarted once stopped. `docker exec` is the correct attach primitive for a running container. The `--user <uid>` flag ensures the exec session runs as the correct user, matching the initial launch.

**Alternative considered**: Re-using `docker attach`. Rejected because `attach` connects to PID 1's stdio, not a new shell session, which is not the desired UX.

### Decision 3: Config hash covers `tools` and `image` fields only

**Choice**: The config hash is `sha256(JSON.stringify({ tools: sorted(config.tools), image: config.image }))` — the fields that determine the built image. Network mode and other runtime flags do not affect the image and therefore do not invalidate a running container.

**Rationale**: Only changes that require a different image should trigger a rebuild prompt. Network mode could theoretically change between runs, but modifying the network of a running container is not possible anyway — the container would need to be recreated. Keeping the hash narrow avoids unnecessary rebuild prompts.

### Decision 4: Rebuild prompt on config mismatch, auto-rebuild for non-interactive passthrough

**Choice**: When a running container's config hash differs from the current resolved config:
- Interactive (`focus` / `focus run`): print a warning and prompt `Rebuild? [Y/n]`. Default yes. If confirmed, stop the old container and launch a new one.
- Non-interactive (`focus -- <cmd>`): automatically stop and relaunch without prompting, printing a notice to stderr.

**Rationale**: Interactive sessions should not silently discard a running container the user may be using. Non-interactive passthrough commands are typically used in scripts where an interactive prompt would hang; auto-rebuild is the least-surprise behavior.

### Decision 5: Orphan cleanup on every launch

**Choice**: On every `focus run` invocation, query `docker ps --filter label=focus.cwd` to enumerate all running focus containers, then prune any whose `focus.cwd` label points to a directory that no longer exists on the host.

**Rationale**: Containers may outlive their working directories (directory deleted, rename, etc.). Cleaning up eagerly on launch keeps Docker state tidy without a separate GC command. The cost is one extra `docker ps` call per launch — negligible.

## Risks / Trade-offs

- **Docker inspect latency**: Each `focus` invocation now calls `docker inspect` before launching. On a cold Docker daemon this adds ~100ms. Acceptable for a CLI tool that is not latency-critical.
- **Label spoofing**: A manually created container with `focus.config-hash` labels set to matching values would be treated as a valid focus container. Low risk in practice; the container name is also checked and is derived from the cwd hash.
- **Concurrent invocations in the same directory**: Two simultaneous `focus` invocations could both pass the "not running" check and race to `docker run`. The second will fail with a name-collision error from Docker. This edge case is acceptable for a personal tool; a proper solution would require file locking.

## Open Questions

- Should `focus status` print the config hash so users can see whether a running container was built from the current config? Deferred to Phase 7 polish.
