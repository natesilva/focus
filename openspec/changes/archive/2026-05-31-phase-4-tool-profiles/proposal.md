## Why

Phases 1–3 established a working container with config-driven behavior and persistent volumes, but the tool set inside the container is still just a raw base image — the `tools:` list in `.focus.yaml` is stored but never acted on. Phase 4 closes that gap: profiles translate tool names into an installable, cacheable container image.

## What Changes

- Introduce a predefined profile catalog (git, ripgrep, node, python, rust, claude-code, ssh) where each profile declares what to install and which volume slots it requires.
- Add an image builder that assembles a Dockerfile from the resolved profile list and builds (or reuses from cache) a tagged image before container launch.
- Support custom user-defined profiles loaded from `~/.config/focus/profiles/`.
- Modify container launch to use the image builder output rather than `FocusConfig.image` directly when a tool list is present.

## Capabilities

### New Capabilities

- `tool-profile-catalog`: Defines the predefined profile catalog and loads both built-in and user-defined custom profiles. Each profile declares its install steps and required volume slots.
- `image-builder`: Given a resolved list of profile names and a base image, produces a built container image tag. Caches by content hash so repeated runs with the same profile set skip the build step.

### Modified Capabilities

- `container-launch`: The image used at launch is now determined by the image builder (from the tool list) rather than taken directly from `FocusConfig.image`. When no tools are specified, `FocusConfig.image` is used as a passthrough.

## Impact

- New source files: `src/profiles/catalog.ts`, `src/profiles/custom.ts`, `src/image-builder.ts`
- `src/container.ts` updated to invoke the image builder before launch
- `~/.cache/focus/` (XDG cache) used for built image layer cache
- `~/.config/focus/profiles/` (XDG config) scanned for custom profile definitions
- No changes to the runtime adapter interface; image building uses the Docker CLI directly
- No breaking changes to `.focus.yaml` or `config.yaml` schema (the `tools` field already exists)
