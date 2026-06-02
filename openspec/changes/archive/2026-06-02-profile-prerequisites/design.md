## Context

Tool profiles are YAML files that declare shell install commands. Currently every profile is self-contained — it installs its own dependencies inline. `claude-code.yaml` installs Node.js from scratch despite a `node` profile existing. There is no way to express inter-profile dependencies, so when both are active, Node is installed twice, and the install order is incidentally alphabetical rather than explicitly controlled.

The resolution path (`resolveProfiles`) today is four lines: load all profiles, look up each requested name, return the list. The image builder sorts profiles alphabetically and emits one `RUN` block per profile.

## Goals / Non-Goals

**Goals:**
- Add a `prerequisites` field to the profile schema so profiles can declare which other profiles must be installed before them.
- Expand the requested tool set transitively to include all prerequisites, auto-injecting any not explicitly listed.
- Produce the Dockerfile layers in topological order (prerequisites before dependents).
- Detect and report missing prerequisites and circular dependency chains.
- Refactor `claude-code.yaml` (and any other builtins with implicit deps) to use `prerequisites` instead of duplicated install steps.

**Non-Goals:**
- Ordering-only mode (prerequisites always means auto-inject, not just ordering).
- Backwards-compatibility shims (project is pre-public).
- Displaying dependency trees in `focus info` (noted for later).

## Decisions

### Topo sort lives in `resolveProfiles`, not in the image builder

The image builder is a dumb formatter: given profiles in some order, emit `FROM` + one `RUN` per profile. Sorting policy — whether alphabetical today or topological tomorrow — belongs in the resolver, which already knows about profile names and their relationships.

Alternative considered: keep the sort in `generateDockerfile`. Rejected because the image builder would need access to the full dependency graph to do topo sort, which is not its responsibility and would couple it to profile loading logic.

### `computeTag` continues to sort alphabetically

The tag is a fingerprint of *what* is installed, not *in what order*. Keeping alphabetical sort means `tools: [claude-code]` (which auto-injects `node`) produces the same tag as `tools: [claude-code, node]`, making the cache content-addressed by tool set regardless of how the set was assembled.

Alternative considered: sort by topo order in the tag too. Rejected — topo order isn't unique (multiple valid orderings exist), so the tag would be unstable across equivalent configurations.

### `generateDockerfile` honors input order, no longer sorts internally

With `resolveProfiles` now returning a topologically ordered list, `generateDockerfile` just iterates profiles as given. Removing the internal sort is the minimal change: the function becomes a pure formatter.

The existing test asserting alphabetical order must be updated to reflect that the function respects input order.

### Kahn's algorithm (BFS) for topological sort

Simple, iterative, naturally detects cycles as a by-product (remaining nodes with in-degree > 0 after the main loop). Alphabetical tie-breaking within each BFS frontier makes the output deterministic across equivalent configurations.

Alternative considered: DFS with visited/in-progress markers. Produces a valid topo order but cycle error reporting is more complex (requires tracking the path). Kahn's is simpler for this use case.

### Auto-injection prints to stderr, one line per injected profile

Format: `note: adding "node" (required by claude-code)`. This matches how package managers communicate implicit dependency resolution — informational, not a warning or error. Goes to stderr because it's operational context, not user-requested output.

If multiple profiles require the same prerequisite, the note is printed only once (deduplication happens before printing).

### Only `claude-code` among current builtins has an implicit dep

Audit: `git`, `ripgrep`, `node`, `python`, `rust`, `ssh` are all self-contained APT installs. Only `claude-code` installs Node.js inline (via the NodeSource script). After the refactor, `claude-code.yaml` declares `prerequisites: [node]` and drops the curl/apt Node install steps, keeping only `npm install -g @anthropic-ai/claude-code` and the cleanup step.

## Risks / Trade-offs

**Cache invalidation for existing `claude-code` users** → After the refactor, `tools: [claude-code]` resolves to `{claude-code, node}` instead of `{claude-code}`. The hash changes, so any locally cached image for `claude-code` alone is invalidated and will be rebuilt. Acceptable: the project is pre-public and the rebuilt image is functionally identical (Node still installed, just via the `node` profile layer).

**Circular dependency errors fail at resolve time, not build time** → Cycles are detected in `resolveProfiles` before any Docker call. This is the right place — better to fail fast with a clear message than to spin indefinitely or produce a malformed Dockerfile.

**Custom profiles can declare prerequisites on built-ins (and vice versa)** → This is intentional and correct. The prerequisite lookup uses the same merged map (built-ins + custom) that `resolveProfiles` already uses. No special-casing needed.
