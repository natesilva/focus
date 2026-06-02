## Why

Tool profiles currently install their own dependencies inline, making the install order implicit and fragile when multiple profiles are active — for example, `claude-code` installs Node.js from scratch even though a `node` profile exists. There is no way to declare that one profile requires another, so dependencies are duplicated and ordering is accidental.

## What Changes

- Add an optional `prerequisites` field to the tool profile schema (YAML and TypeScript type).
- `resolveProfiles` expands the requested tool set to include all transitive prerequisites, prints an informational line for each auto-injected profile, detects missing prerequisites (error) and circular chains (error), and returns profiles in topological order.
- `generateDockerfile` is changed to honor the order of the profiles it receives rather than sorting alphabetically (topological order is now established upstream).
- `computeTag` continues to sort alphabetically — the cache key is a fingerprint of the tool *set*, not its install order.
- Builtin profiles are refactored: install steps that duplicate another profile's responsibility are removed and replaced with a `prerequisites` declaration. The primary case is `claude-code`, which currently installs Node.js inline; it will declare `prerequisites: [node]` and delegate that step to the `node` profile.

## Capabilities

### New Capabilities

- `profile-prerequisites`: Declaring, resolving, and topologically ordering inter-profile dependencies. Covers the `prerequisites` schema field, transitive expansion, cycle detection, missing-prerequisite errors, auto-injection informational output, and the topological sort used by the Dockerfile generator.

### Modified Capabilities

- `tool-profile-catalog`: The builtin profile YAML files change — `claude-code` (and any other profiles with implicit deps) gain a `prerequisites` key and lose the duplicated install steps.
- `builtin-profile-yaml-loader`: The YAML schema gains the `prerequisites` field.
- `image-builder`: `generateDockerfile` stops sorting internally; sort order is now the caller's responsibility.

## Impact

- `src/profiles/types.ts` — new field on `Profile`
- `src/profiles/loader.ts` — Zod schema update
- `src/profiles/index.ts` — core resolution logic rewritten
- `src/image-builder.ts` — `generateDockerfile` sort removed
- `src/profiles/builtins/claude-code.yaml` — refactored; other builtins audited
- `src/profiles/profiles.test.ts` — new tests for prerequisite resolution
- `src/image-builder.test.ts` — existing alphabetical-order test updated
