## Why

`focus` is functionally complete through Phase 6 but lacks the documentation, error clarity, and test coverage needed to share it publicly. Phase 7 brings the project to portfolio-ready quality: self-explanatory from the README, robust against common setup failures, and well-tested at the shell layer.

## What Changes

- `README.md`: overview, installation, usage, configuration reference, profile catalog
- `LICENSE` file (MIT)
- Example `.focus.yaml` files for common project types (Node, Python, Rust)
- `focus --version` flag
- Meaningful error messages for common failure modes: runtime not found, UID mismatch, missing config, image build failure
- Set `TERM=xterm-256color` and `COLORTERM=truecolor` in every launched container so interactive tools render full color
- Integration test coverage for `entrypoint.sh`: home directory ownership and volume-dotdir symlink fallback when host UID maps to a pre-existing image user

## Capabilities

### New Capabilities

- `error-handling`: Standardized, user-facing error messages for common failure modes with actionable remediation guidance

### Modified Capabilities

- `cli-entrypoint`: Add `--version` flag that prints the package version and exits
- `container-launch`: Set `TERM` and `COLORTERM` environment variables in every container launch invocation

## Impact

- `src/cli.ts` — `--version` flag
- `src/container.ts` — TERM/COLORTERM env vars; structured error messages at launch boundaries
- `src/runtime/docker.ts`, `src/runtime/apple-containers.ts` — runtime-not-found errors with remediation hints
- `src/entrypoint.sh` — shell integration tests (new test harness)
- New files: `README.md`, `LICENSE`, `examples/node.focus.yaml`, `examples/python.focus.yaml`, `examples/rust.focus.yaml`
