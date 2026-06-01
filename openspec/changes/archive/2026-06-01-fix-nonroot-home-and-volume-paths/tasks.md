## 1. Home-directory ownership

- [x] 1.1 In `src/entrypoint.sh`, after resolving `USERNAME`/`ACTUAL_HOME`, `chown $FOCUS_UID "$ACTUAL_HOME"` (guarded by a directory-exists check), non-recursive
- [x] 1.2 Add a comment explaining why the runtime-created home is root-owned and why the chown is non-recursive

## 2. Volume reachability for a divergent home

- [x] 2.1 In `src/entrypoint.sh`, when `ACTUAL_HOME` differs from `/home/focususer`, symlink each volume dotdir from `/home/focususer` into `ACTUAL_HOME`, skipping any pre-existing target
- [x] 2.2 Update the stale `CONTAINER_HOME` comment in `src/volumes.ts` to describe the symlink fallback (drop the obsolete "Phase 6" note)

## 3. Profile install corrections (no spec delta)

- [x] 3.1 `claude-code` profile: install Node 24 + `npm install -g @anthropic-ai/claude-code` (system-wide, on PATH) instead of the per-user `curl | bash` installer
- [x] 3.2 `rust` profile: install apt `rustc`/`cargo` instead of root-only `rustup`; drop the non-existent `rust-cargo`/`rust-rustup` volume slots

## 4. Verification

- [x] 4.1 Confirm Claude Code reaches its UI in a non-root container with `~/.claude` bind-mounted (manual: `focus stop && focus`, then `claude`)
- [x] 4.2 Confirm `stat ~` shows the home owned by the host UID after launch
- [x] 4.3 Run the unit test suite (`node --test`) — all green
- [x] 4.4 Sync the two delta specs into `openspec/specs/` and archive the change
