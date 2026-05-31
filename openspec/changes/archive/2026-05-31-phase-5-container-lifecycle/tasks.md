## 1. Container Identity Module

- [x] 1.1 Add `configHash(config: FocusConfig): string` function to `src/container.ts` — SHA-256 of `{ tools: sorted, image }`, first 16 hex chars
- [x] 1.2 Update the Docker `start` options interface to accept `configHash` and `cwd` label fields
- [x] 1.3 Add `--label focus.cwd=<cwd>` and `--label focus.config-hash=<hash>` to the `docker run` args in `src/runtime/docker.ts`

## 2. Docker Runtime: Inspect and Exec

- [x] 2.1 Add `inspect(name: string): Promise<{ running: boolean; labels: Record<string, string> }>` to `src/runtime/docker.ts`
- [x] 2.2 Add `exec(name: string, uid: number, command: string[] | undefined, tty: boolean): Promise<number>` to `src/runtime/docker.ts` — uses `docker exec --user <uid> [-it|-i] <name> /bin/bash` or the given command
- [x] 2.3 Add `listFocusContainers(): Promise<Array<{ name: string; cwd: string }>>` to `src/runtime/docker.ts` — uses `docker ps --filter label=focus.cwd --format json`

## 3. Container Lifecycle Logic

- [x] 3.1 Add `attachContainer(name: string, uid: number, command?: string[]): Promise<number>` to `src/container.ts` — delegates to `docker.exec`
- [x] 3.2 Update `runContainer` in `src/container.ts` to call `docker.inspect` before launching: if running with matching hash → attach; if running with mismatched hash → call rebuild handler; if not running → proceed with launch
- [x] 3.3 Implement `pruneOrphanedContainers()` in `src/container.ts` — calls `docker.listFocusContainers()`, checks each cwd with `fs.access`, stops containers whose cwd is missing
- [x] 3.4 Call `pruneOrphanedContainers()` at the start of `runContainer` (before the identity check)

## 4. Rebuild Prompt

- [x] 4.1 Add `promptRebuild(): Promise<boolean>` utility in `src/container.ts` — reads a line from stdin, defaults to yes on empty input
- [x] 4.2 In `runContainer`, when interactive and hash mismatch is detected: print warning, call `promptRebuild()`; if confirmed stop old container then launch new one; if declined exit 0
- [x] 4.3 In `runContainer`, when non-interactive (`command` is defined) and hash mismatch: print notice to stderr, stop old container, launch new one

## 5. Stop and Status Commands

- [x] 5.1 Update `stopContainer` in `src/container.ts` to print a confirmation message when a container was stopped (currently only `cli.ts` handles the "nothing running" message — unify into `stopContainer` return value or keep in CLI handler)
- [x] 5.2 Update `containerStatus` in `src/container.ts` to return `{ running: boolean; configCurrent: boolean | null }` — use `docker.inspect` to compare stored hash with current config hash; `configCurrent` is `null` when not running
- [x] 5.3 Update `cli.ts` status handler to print config-currency info alongside running state

## 6. Tests

- [x] 6.1 Unit tests for `configHash` — same tools different order, different tools, different images
- [x] 6.2 Unit tests for `docker.inspect` and `docker.exec` (mock `execFile`/`spawn`)
- [x] 6.3 Unit tests for `listFocusContainers` parsing (mock `docker ps` output)
- [x] 6.4 Integration-style tests for `runContainer` attach path and rebuild path (mock docker module)
