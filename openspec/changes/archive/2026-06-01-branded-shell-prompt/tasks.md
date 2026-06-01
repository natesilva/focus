## 1. Config Schema

- [x] 1.1 Add `shell` field to `ProjectConfigSchema` in `src/config/project.ts` — `z.object({ prompt: z.union([z.boolean(), z.object({ style: z.enum(['inline', 'two-line']) })]).optional() }).optional()`
- [x] 1.2 Add `shell?: { prompt?: boolean | { style: 'inline' | 'two-line' } }` to the `FocusConfig` interface in `src/config/resolver.ts`
- [x] 1.3 Thread `shell: project?.shell` through `resolveConfig()` so it is included in the resolved config

## 2. Container Launch

- [x] 2.1 In `container.ts`, derive `FOCUS_PROJECT` as `path.basename(cwd)` and add it to the env passed in `StartOptions`
- [x] 2.2 Derive `FOCUS_PROMPT_STYLE` from `config.shell?.prompt`: `false` → `"off"`, `{ style: "inline" }` → `"inline"`, anything else (true, undefined) → `"two-line"` — and add it to the env

## 3. Entrypoint Prompt Injection

- [x] 3.1 In `entrypoint.sh`, after home-dir setup and before the final `exec`, read `FOCUS_PROMPT_STYLE` and skip injection when it equals `"off"`
- [x] 3.2 Guard against double-injection by checking for a `# focus-prompt` marker in `/etc/bash.bashrc` before appending
- [x] 3.3 Append the two-line PS1 block when `FOCUS_PROMPT_STYLE` is `"two-line"` (or empty/unset): `[focus · $FOCUS_PROJECT]` in bold green, `\w` in blue, `\n\$ ` on a new line
- [x] 3.4 Append the inline PS1 block when `FOCUS_PROMPT_STYLE` is `"inline"`: same badge and path on one line followed by ` \$ `

## 4. Tests

- [x] 4.1 Add unit tests for the `FOCUS_PROMPT_STYLE` derivation logic in `container.ts` (test `false`, `true`, `undefined`, `{ style: "inline" }`, `{ style: "two-line" }`)
- [x] 4.2 Add project config schema tests for the new `shell` field: valid values, `false`, `{ style: "inline" }`, unknown style rejected, unknown keys rejected
- [x] 4.3 Verify `tsc --noEmit` passes with no type errors

## 5. Documentation

- [x] 5.1 Remove "Branded shell prompt" from `docs/future-features.md` (feature is now implemented)
