## Context

Phases 1–3 produced a container that launches with the correct directory, user UID, and persistent volumes. The `tools:` field in `.focus.yaml` is parsed and stored in the resolved config, but nothing consumes it — the container still uses whatever base image `FocusConfig.image` points to. Phase 4 makes the tool list meaningful: a profile catalog translates tool names to install steps, and an image builder turns those steps into a built container image before launch.

The Docker runtime is the only backend at this stage; the image builder invokes the `docker build` CLI directly. Phase 6 (Apple Containers backend) will revisit the interface if needed.

## Goals / Non-Goals

**Goals:**
- Define a catalog of predefined profiles (git, ripgrep, node, python, rust, claude-code, ssh) as typed TypeScript objects.
- Support user-defined profiles as YAML files under `~/.config/focus/profiles/`.
- Build a container image from the resolved profile list using `docker build`, caching by content hash.
- Integrate the image builder into container launch so the image is built (or cache-hit) before the container starts.

**Non-Goals:**
- Multi-stage or layer-optimized Dockerfiles — single `RUN` layer per profile is sufficient for now.
- Profile dependency resolution (e.g., `claude-code` depending on `node`) — profiles are independent; the user lists what they want.
- Image push/pull from registries.
- Runtime-specific image building for Apple Containers (deferred to Phase 6).

## Decisions

### Built-in profiles as TypeScript, custom profiles as YAML

Built-in profiles are typed TypeScript objects (`src/profiles/catalog.ts`). This gives compile-time safety and avoids packaging concerns. User-defined custom profiles are YAML files (`~/.config/focus/profiles/<name>.yaml`) because they are user-editable and the format is familiar from `.focus.yaml` and `config.yaml`.

Alternative considered: YAML files for everything (including built-ins), loaded at runtime. Rejected because it adds file-system I/O to a hot path and loses type checking on the catalog itself.

### Image cache key: SHA-256 of base image + sorted profile names

The cache key is `sha256(baseImage + "\n" + sortedProfileNames.join("\n"))`, truncated to 12 hex chars for the Docker image tag: `focus-built:<hash>`. Before building, the image builder checks whether a Docker image with that tag already exists (`docker image inspect`). If it does, build is skipped.

Alternative considered: keying on Dockerfile content hash. More precise but adds complexity — the sorted-names hash is deterministic and correct for this use case since profile content is immutable between focus versions.

### Single concatenated Dockerfile, one RUN layer per profile

The image builder generates a Dockerfile: `FROM <baseImage>` followed by one `RUN` block per profile (in declaration order). No multi-stage builds. Docker's layer cache handles incremental rebuilds when only some profiles change, because profile order is stable (sorted alphabetically before codegen).

Alternative considered: multi-stage builds with `COPY --from=<stage>` to share layers across different profile sets. Rejected as premature — the complexity isn't justified until we have evidence that single-stage builds are too slow.

### Custom profile schema: `install` array + `volumes` array

```yaml
install:
  - apt-get install -y ripgrep
volumes: []
```

`install` is a list of shell commands joined into a single `RUN` step. `volumes` is a list of volume slot names from the catalog (e.g., `claude`, `ssh`). This is intentionally minimal.

Alternative considered: exposing the full Dockerfile syntax (e.g., `ENV`, `COPY`). Too much power for the use case; install commands are sufficient for tool installation.

### Fallback to FocusConfig.image when tools list is empty

If `FocusConfig.tools` is empty (`[]`), the image builder is not invoked and the container launches directly with `FocusConfig.image`. This preserves backward compatibility and the "raw base image" escape hatch.

## Risks / Trade-offs

- **First build is slow** → The first `docker build` for a given profile set can take minutes. Mitigation: the cache-hit path is fast (one `docker inspect` call); subsequent runs are instant. A progress message during first build manages expectations.
- **Stale cache after focus update** → If a built-in profile's install steps change in a new version of focus, the old cached image (keyed by profile names, not content) will be used. Mitigation: document `focus cache clear` as a manual escape hatch (implementation deferred to Phase 7); the cache key could be extended to include a focus version prefix in a future phase.
- **Docker daemon required** → Image building requires a running Docker daemon. If Docker is unavailable, the error surfaces at build time with a clear message. Mitigation: the error path already exists in the Docker runtime adapter.
- **Custom profile YAML is not sandboxed** → `install` commands run as root inside the container build context. This is intentional (installing packages requires root), but malicious custom profiles could do anything. Mitigation: custom profiles are user-authored and user-controlled; no third-party profile distribution mechanism exists.

## Open Questions

- Should the image builder emit a progress spinner/stream during `docker build`? Decided to stream Docker's output directly to stderr so the user sees build progress without extra code.
- Should built-in profiles pin package versions? For now, no — `apt-get install -y <pkg>` without a version pin keeps the profiles simple. Phase 7 can revisit if reproducibility becomes a priority.
