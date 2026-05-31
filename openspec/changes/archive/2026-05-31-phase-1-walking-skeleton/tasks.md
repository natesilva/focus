## 1. Project Scaffolding

- [x] 1.1 Initialize `package.json` with `"type": "module"`, `bin` entry pointing to `src/cli.ts`, and dev dependencies (`typescript`, `@tsconfig/node-ts`, `@tsconfig/node24`)
- [x] 1.2 Add `tsconfig.json` extending `@tsconfig/node-ts` and `@tsconfig/node24`
- [x] 1.3 Create `src/` directory structure: `cli.ts`, `runtime/docker.ts`, `container.ts`, `uid.ts`

## 2. Host UID Resolution

- [x] 2.1 Implement `uid.ts`: read host UID from `process.getuid()`

## 3. Container Name Derivation

- [x] 3.1 Implement deterministic container name in `container.ts`: `focus-<8-char hex digest of absolute cwd>`

## 4. Docker Runtime Adapter

- [x] 4.1 Implement `runtime/docker.ts` `start()`: build `docker run` args with bind mount, user entrypoint, and TTY flags; spawn with inherited stdio
- [x] 4.2 Implement `runtime/docker.ts` `stop()`: run `docker stop <name>`; treat "no such container" as success
- [x] 4.3 Implement `runtime/docker.ts` `status()`: run `docker inspect --format '{{.State.Running}}' <name>`; return `{ running: boolean }`
- [x] 4.4 Implement TTY detection: pass `-it` when `process.stdin.isTTY`, else `-i`

## 5. Container Entrypoint Script

- [x] 5.1 Write a minimal shell entrypoint that creates a user with the host UID (if not already present) and execs the requested shell or command as that user
- [x] 5.2 Embed or bundle the entrypoint so it is available at container launch without a custom image

## 6. CLI Entry Point

- [x] 6.1 Implement `cli.ts`: parse `process.argv` to route `run` (default), `stop`, `status`, and `-- <cmd>` passthrough
- [x] 6.2 Wire `focus run` / bare `focus` to `container.ts` start logic with interactive shell
- [x] 6.3 Wire `focus -- <cmd>` to `container.ts` start logic with command passthrough and exit code propagation
- [x] 6.4 Wire `focus stop` to `container.ts` stop logic
- [x] 6.5 Wire `focus status` to `container.ts` status logic with human-readable output

## 7. Verification

- [x] 7.1 Run `tsc --noEmit` and resolve any type errors
- [x] 7.2 Manually verify `focus run` drops into a shell with `/focus` mounted correctly
- [x] 7.3 Manually verify `focus -- pwd` prints `/focus` and exits with code 0
- [x] 7.4 Manually verify `focus status` reports running after `focus run` in another terminal
- [x] 7.5 Manually verify `focus stop` stops the container and `focus status` reports not running
