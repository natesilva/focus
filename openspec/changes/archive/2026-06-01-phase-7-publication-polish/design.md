## Context

All core features are implemented through Phase 6. Phase 7 addresses surface quality: the project needs a README, a license, and example configs before it can be shared. Beyond documentation, three small behavioral gaps remain: error messages are raw Node.js stack traces, interactive tools inside the container render without color because `TERM`/`COLORTERM` are unset, and the shell behaviors in `entrypoint.sh` have no automated test coverage despite being fully specced.

## Goals / Non-Goals

**Goals:**
- README, LICENSE, and example `.focus.yaml` files
- `--version` flag
- User-facing error messages for common failure modes with remediation hints
- `TERM` and `COLORTERM` set in every container launch
- Shell integration tests for `entrypoint.sh` behaviors (home dir ownership, volume-dotdir symlink fallback)

**Non-Goals:**
- New features or runtime backends
- Interactive diagnostic (`focus doctor`) — deferred; too much scope for a polish phase
- Automated README generation or versioned docs

## Decisions

### Error message strategy

**Decision**: Catch errors at the top-level command handlers in `cli.ts` and print a clean one-line message before exiting with a non-zero code. Do not catch inside adapter/container modules — let errors propagate naturally and format them at the boundary.

**Rationale**: Catching at the boundary keeps error-handling logic in one place and ensures consistent formatting. Catching inside adapters would scatter formatting concerns and make errors harder to test.

**Alternative considered**: A global `process.on('uncaughtException')` handler. Rejected — it swallows the stack trace in non-error paths and makes debugging harder during development.

### `--version` implementation

**Decision**: Read version from `package.json` using a static `import` with an `assert { type: 'json' }` attribute (Node 22+). Print `focus/<version>` and exit 0.

**Rationale**: Single source of truth is `package.json`; no need for a generated version file. Node 22 supports JSON imports natively.

### TERM / COLORTERM injection

**Decision**: Add `TERM=xterm-256color` and `COLORTERM=truecolor` to the environment map passed to every `runContainer` / `exec` call inside `container.ts`. Do not put this in the adapter layer — it is a product decision, not a runtime detail.

**Rationale**: The adapter's job is to translate launch options to CLI flags, not to decide what the environment should contain. Keeping it in `container.ts` means both Docker and Apple Containers adapters get it for free.

**Alternative considered**: Setting `TERM` inside `entrypoint.sh`. Rejected — `entrypoint.sh` runs after the process is already attached; setting env vars there does not affect interactive shells spawned by the runtime's attach command.

### `entrypoint.sh` test harness

**Decision**: Use [bats-core](https://github.com/bats-core/bats-core) (Bash Automated Testing System). Install via apt inside a dedicated test Dockerfile (not in the tool profile images). Tests run in a real container, exercising the entrypoint script end-to-end against a minimal base image.

**Rationale**: `entrypoint.sh` has no TypeScript surface; it can only be tested as a shell script running in a container. bats is the de-facto standard and has no runtime dependencies beyond bash.

**Alternative considered**: Mocking shell behaviors with sourced functions. Rejected — the interesting behaviors involve `chown`, `useradd`, and symlink creation, which need a real user/namespace context.

### Test execution

**Decision**: Shell integration tests run via `npm test` alongside the existing Node.js tests, invoked through a `test:shell` script that builds the test image and runs bats inside it. CI runs both suites.

## Risks / Trade-offs

- [Container build in tests] The bats tests require building a Docker image at test time, which adds latency and a Docker dependency to the test suite. → Mitigation: the test image is minimal (no focus tool profiles); build time should be under 30 seconds.
- [JSON import assertion] `import ... assert { type: 'json' }` syntax may vary across Node versions. → Mitigation: Node 22 (the project's pinned version) has stable support; verify with `tsc --noEmit`.
- [TERM passthrough] Some environments (CI, non-interactive shells) may already set `TERM=dumb`; overriding it unconditionally could break scripts that check `TERM`. → Mitigation: this is intentional — the container is the user's interactive dev environment, not a CI runner; full color is the right default.
