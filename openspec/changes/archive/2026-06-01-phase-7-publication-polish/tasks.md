## 1. Documentation

- [x] 1.1 Write `README.md` with overview, prerequisites, installation, quickstart, command reference, config reference, and profile catalog
- [x] 1.2 Add `LICENSE` file (MIT)
- [x] 1.3 Create `examples/node.focus.yaml` with a Node.js project template
- [x] 1.4 Create `examples/python.focus.yaml` with a Python project template
- [x] 1.5 Create `examples/rust.focus.yaml` with a Rust project template

## 2. Version Flag

- [x] 2.1 Import `package.json` version in `src/cli.ts` using a JSON import
- [x] 2.2 Add `--version` flag to the CLI that prints the version string and exits 0

## 3. Terminal Environment

- [x] 3.1 Add `TERM=xterm-256color` and `COLORTERM=truecolor` to the env map passed to `runContainer` and `exec` in `src/container.ts`

## 4. Error Handling

- [x] 4.1 Add a top-level error boundary in `src/cli.ts` that catches known error types and prints clean one-line messages without stack traces
- [x] 4.2 Throw a typed `FocusError` (or equivalent) from the Docker adapter when the `docker` binary is not found, with a remediation hint
- [x] 4.3 Throw a typed error from the Apple Containers adapter when the `container` binary is not found, with a macOS 26 hint
- [x] 4.4 Throw a typed error from the image builder when `buildImage` fails, referencing the failing profile set
- [x] 4.5 Propagate config validation errors from `src/config/resolver.ts` with the offending file path included in the message
- [x] 4.6 Preserve full stack trace for unexpected internal errors (non-FocusError) in the CLI boundary handler

## 5. Entrypoint Shell Tests

- [x] 5.1 Add `bats-core` as a dev dependency (install via apt or npm) and add a `test:shell` npm script
- [x] 5.2 Write a minimal test Dockerfile that copies `entrypoint.sh` and installs bats
- [x] 5.3 Write bats test: home directory is owned by the container user after entrypoint runs
- [x] 5.4 Write bats test: a new file can be created directly in `$HOME` by the container user
- [x] 5.5 Write bats test: volume-dotdir symlinks are created in the actual home when the host UID maps to an image user with a different home (e.g. UID 1000 → `ubuntu` with home `/home/ubuntu`)
- [x] 5.6 Write bats test: existing entries at symlink target paths are not overwritten
- [x] 5.7 Integrate `test:shell` into the main `test` script so it runs alongside the Node.js tests
