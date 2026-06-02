## Why

`focus` is approaching a releasable state but has no user-facing documentation — only internal planning and design files in `docs/`. Before distribution, users need concise reference docs covering installation, configuration, and usage. The planning files should be moved out of the way so the docs directory reads cleanly.

## What Changes

- Move internal planning docs (`plan.md`, `future-features.md`, `implemented-features.md`, `devcontainer-features-research.md`) into `docs/internal/`
- Write `docs/getting-started.md` — installation (TBD placeholder), prerequisites, quickstart
- Write `docs/configuration.md` — all config files, their locations, and their fields
- Write `docs/profiles.md` — built-in profile catalog + how to write custom profiles
- Write `docs/focus-vs-devcontainers.md` — brief, honest comparison
- Write `docs/about.md` — what focus is, OpenSpec/SDD portfolio note
- Update `docs/design.md` in place to remain as architectural reference (it's already internal-ish but well-written; keep it where it is inside `docs/internal/` too)

## Capabilities

### New Capabilities

- `user-documentation`: The set of user-facing markdown docs in `docs/` — covering getting started, configuration reference, profile system, and project context

### Modified Capabilities

<!-- none — this is purely additive documentation work; no spec-level behavior changes -->

## Impact

- `docs/` directory structure changes (internal files move to `docs/internal/`)
- No source code changes
- `README.md` may get minor link updates if it references `docs/` paths
