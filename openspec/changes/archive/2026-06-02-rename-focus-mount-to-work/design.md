## Context

The `project-subpath-mount` change (layout version 2) moved the project bind-mount from `/focus` to `/focus/<dirname>`, giving the container a persistent workspace volume at `/focus` and the project at `/focus/<dirname>`. The side effect: the default shell prompt, `[focus · my-app] /focus/my-app`, now repeats both the tool name and the project name — once in the label and once in the path.

Renaming the container-internal root from `/focus` to `/work` eliminates the redundancy. Combined with simplifying the label to `[focus]`, the prompt becomes `[focus] /work/my-app`: brand once, project once.

## Goals / Non-Goals

**Goals:**
- Eliminate redundancy in the default shell prompt
- Rename the container-internal mount root from `/focus` to `/work`
- Simplify the prompt label from `[focus · <project>]` to `[focus]`
- Detect pre-existing containers as stale via `layoutVersion` bump

**Non-Goals:**
- No changes to container naming (`focus-<hash8>`)
- No changes to workspace volume naming (`focus-ws-<hash8>`)
- No changes to Docker labels (`focus.cwd`, `focus.config-hash`)
- No changes to host-side paths (XDG dirs, volume dirs)
- No changes to the `FOCUS_PROJECT` env var (still used internally by the entrypoint)
- No support for configuring the mount root path

## Decisions

**`/work` over alternatives**

`/workspace` was explicitly ruled out in the original design due to conflicts with monorepo tooling. `/proj`, `/project`, and `/src` are semantically narrower and misleading when git worktrees (non-source trees) are created as siblings. `/work` is short, generic, and not overloaded by any common tooling.

**Drop `· <project>` from label rather than shorten the path**

The project name still appears naturally in the path (`/work/my-app`). Keeping it in the label would mean it appears twice; dropping it from the label means it appears exactly once (in the path), which is correct. The `[focus]` label still identifies the tool/environment. The `FOCUS_PROJECT` env var remains available if scripts need the project name programmatically.

**`layoutVersion: 3`**

Containers with the old `/focus` mount cannot be reused: they have a workspace volume at `/focus` and a project bind-mount at `/focus/<dirname>`. A new container needs both at `/work`. The existing `layoutVersion` mechanism handles this: the new code hashes with `layoutVersion: 3`, old containers stored `layoutVersion: 2`, so the hash mismatch triggers a rebuild prompt on next `focus` invocation.

## Risks / Trade-offs

**Existing containers require rebuild** → Mitigation: `layoutVersion` bump ensures automatic detection; user is prompted before rebuild, not forced.

**Hardcoded `/work` path inside container** → Any user documentation, scripts, or tool configs that reference `/focus/<dirname>` paths inside the container will break. This is expected for a `BREAKING` path rename; the change is small and localized to container-internal paths only.

**`/work` could conflict in some base images** → Unlikely; `/work` is not a reserved or conventional directory in Debian/Ubuntu. If a base image ships something at `/work`, the volume mount will shadow it — same risk that existed with `/focus`.
