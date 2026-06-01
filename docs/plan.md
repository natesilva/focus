# focus — Project Plan

## Goal

Ship a working personal tool first, then clean it up for GitHub publication. The plan is structured as phases, each ending in a usable milestone. Later phases depend on earlier ones; within a phase, tasks can proceed in parallel.

---

## Phase 1: Walking Skeleton

**Milestone:** `focus` launches a container with the current directory mounted at `/focus` and drops into a shell.

- CLI entry point with `focus` / `focus run` / `focus stop` / `focus status` commands
- Docker-compatible runtime adapter (first and only backend at this stage)
- Hard-coded minimal environment (no tool profiles yet)
- Current directory bind-mounted at `/focus`
- Non-root container user with host UID matching

The Docker-compatible backend is the right starting point: it works on all platforms and is easy to iterate against without hardware constraints.

---

## Phase 2: Configuration

**Milestone:** Behavior is driven by config files, not hardcoded values.

- XDG-compliant path resolution for all config and data locations
- Global config (`~/.config/focus/config.yaml`): preferred runtime, default tool list
- Per-project config (`.focus.yaml`): tool list, network mode, runtime override
- Config merging: global defaults → per-project overrides → CLI flags
- `focus init` command to scaffold a `.focus.yaml` in the current directory

Configuration is a prerequisite for everything that follows; tool profiles and volume management both depend on a stable config schema.

---

## Phase 3: Persistent Volumes

**Milestone:** Tool credentials and configuration survive across container runs.

- Volume lifecycle management: create on first use, reuse on subsequent runs
- Predefined volume slots for common tools (Claude Code auth, SSH keys, Git identity)
- Volumes mounted into the container at the correct paths
- Correct ownership so the non-root container user can read and write them

---

## Phase 4: Tool Profiles

**Milestone:** The tool set inside the container is determined by `.focus.yaml`.

- Predefined profile catalog (git, ripgrep, node, python, rust, claude-code, ssh, …)
- Each profile declares: what to install, which volume slots it needs
- Image builder: assembles an image from the resolved profile list
- Image layer caching: repeated runs with the same profile set are instant
- Custom profile support (`~/.config/focus/profiles/`)

---

## Phase 5: Container Lifecycle

**Milestone:** `focus` attaches to a running container rather than starting a new one each time; config changes are handled gracefully.

- Container identity: keyed on project directory path + tool config hash
- Attach to existing container if already running with the same identity
- Detect config changes; prompt to rebuild when identity changes
- `focus stop` and `focus status` fully implemented
- Cleanup of stopped/orphaned containers

---

## Phase 6: Apple Containers Backend

**Milestone:** `focus` runs natively on macOS via Apple Containers with no Docker dependency.

- Formalize the runtime adapter interface based on what the Docker backend revealed
- Apple Containers adapter implementing that interface
- `runtime: auto` detection logic (prefer Apple Containers on macOS if available)
- Validation that volume mounting and UID handling work correctly under Apple Containers

This phase is deliberately last among the core features: the adapter interface will be better-defined once the Docker backend is fully exercised.

---

## Phase 7: Publication Polish

**Milestone:** The project is ready to share on GitHub and include in a portfolio.

- README: overview, installation, usage, configuration reference
- Profile catalog documentation
- Meaningful error messages for common failure modes (runtime not found, UID mismatch, missing config, etc.)
- `focus --version` and basic self-diagnostic command
- License file
- Example `.focus.yaml` files for common project types
- Set `TERM`/`COLORTERM` in the container environment (e.g. `xterm-256color`/`truecolor`) so interactive tools render full color instead of a washed-out palette
- Automated coverage for `entrypoint.sh` behaviors (no shell/integration test harness exists yet): home-directory ownership for the non-root user, and the volume-dotdir symlink fallback when the host UID maps to a pre-existing image user — see `container-launch` and `volume-manager` specs

---

## Sequencing Summary

```
Phase 1: Walking Skeleton
    └── Phase 2: Configuration
            ├── Phase 3: Persistent Volumes
            └── Phase 4: Tool Profiles
                    └── Phase 5: Container Lifecycle
                            └── Phase 6: Apple Containers Backend
                                    └── Phase 7: Publication Polish
```

Phases 3 and 4 can proceed in parallel once Phase 2 is complete.
