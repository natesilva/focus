## 1. Runtime Adapters

- [x] 1.1 In `src/runtime/docker.ts`, change workspace volume mount from `:/focus` to `:/work` and project bind-mount from `:/focus/${basename(cwd)}` to `:/work/${basename(cwd)}`
- [x] 1.2 In `src/runtime/apple-containers.ts`, apply the same two mount path changes

## 2. Container Launch Logic

- [x] 2.1 In `src/container.ts` `attachContainer`, change workdir from `` `/focus/${basename(cwd)}` `` to `` `/work/${basename(cwd)}` ``
- [x] 2.2 In `src/container.ts` `configHash`, bump `layoutVersion` from `2` to `3`

## 3. Entrypoint Script

- [x] 3.1 In `src/entrypoint.sh`, change `cd "/focus/$FOCUS_PROJECT"` and `git -C "/focus/$FOCUS_PROJECT"` to use `/work/$FOCUS_PROJECT`
- [x] 3.2 In `src/entrypoint.sh`, change the PS1 label from `[focus · ${FOCUS_PROJECT}]` to `[focus]` in both the two-line and inline variants

## 4. Tests

- [x] 4.1 In `src/runtime/docker.test.ts`, update all hardcoded `/focus/api-server` workdir strings to `/work/api-server`
- [x] 4.2 In `src/runtime/docker-lifecycle.test.ts`, apply the same path updates
- [x] 4.3 Check `src/runtime/apple-containers.test.ts` for any `/focus/` path references and update them

## 5. Specs and Docs

- [x] 5.1 Sync delta specs to main specs (`openspec/specs/project-workspace-volume`, `shell-prompt`, `container-launch`, `apple-containers-runtime`)
- [x] 5.2 Update `CLAUDE.md` key design decision: mount path is `/work`, not `/focus`
- [x] 5.3 Update `docs/implemented-features.md` entries that reference `/focus/<dirname>` paths
