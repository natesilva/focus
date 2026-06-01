## Context

`focus shell` drops the user into `bash -i` (interactive, non-login) via `exec runuser -u "$USERNAME" -- /bin/bash -i` in `entrypoint.sh`. This means `/etc/profile.d/` scripts are **not** sourced — only `/etc/bash.bashrc` is. The entrypoint script runs as root before `exec runuser`, giving it write access to `/etc/`.

The project name is known at container start time (`basename(cwd)` in `container.ts`) and can be passed via the existing `StartOptions.env` mechanism. The config resolution path already threads `FocusConfig` through to `container.ts`, so a new `shell.prompt` field is available there.

## Goals / Non-Goals

**Goals:**
- Inject a styled, colorful bash prompt that identifies the `[focus]` environment and project name
- Support two layout styles: inline (single-line) and two-line (default)
- Allow the prompt to be disabled entirely for users who manage their own prompt
- Zero impact on non-interactive runs (`focus -- <cmd>`)

**Non-Goals:**
- zsh, fish, or other shell support — bash only
- Prompt customization beyond style (colors, format strings)
- Installing additional software (no starship, no powerline fonts required)

## Decisions

### Write to `/etc/bash.bashrc`, not `/etc/profile.d/`

`bash -i` (non-login) sources `/etc/bash.bashrc` but not `/etc/profile` or `/etc/profile.d/*.sh`. Writing to `/etc/bash.bashrc` is the correct target for this entrypoint. A user's own `~/.bashrc` is sourced after `/etc/bash.bashrc`, so any user-level `PS1` override in a dotfile or tool profile takes natural precedence — no special "override" mechanism is needed.

**Alternative considered:** Appending to `/etc/profile.d/focus-prompt.sh` — rejected because `bash -i` never sources it.

### Inject via `entrypoint.sh`, not the Dockerfile

The prompt script is written by `entrypoint.sh` at container start rather than baked into the image. This means:
- No image rebuild when the prompt design changes
- The `FOCUS_PROJECT` value (which varies per project) can be embedded directly in the script

**Alternative considered:** Baking a static script into the Dockerfile and passing `FOCUS_PROJECT` as an env var read at PS1 evaluation time — valid, but adds a Dockerfile layer for every base image and requires the PS1 to use `${FOCUS_PROJECT}` as a dynamic expansion (which works but is slightly fragile if the var is unset).

### `FOCUS_PROJECT` passed via `StartOptions.env`

`container.ts` already passes `TERMINAL_ENV` through `StartOptions.env`. Adding `FOCUS_PROJECT: path.basename(cwd)` there requires no adapter changes — both Docker and Apple Containers adapters already plumb `env` into `--env` flags.

### Config shape: `shell.prompt`

Three valid values cover all use cases:

| Value | Meaning |
|---|---|
| `true` (default) | Prompt enabled, two-line style |
| `false` | Prompt disabled |
| `{ style: "inline" }` | Prompt enabled, single-line style |
| `{ style: "two-line" }` | Prompt enabled, two-line style (explicit) |

Using a boolean as a shorthand for the default style keeps the common case simple while the object form allows future extension (e.g., adding `color` or `format` fields).

The `shell.prompt` value is passed to `entrypoint.sh` via an env var (`FOCUS_PROMPT_STYLE`: `"inline"`, `"two-line"`, or `"off"`). The entrypoint uses this to conditionally write the prompt block.

## Risks / Trade-offs

**[Risk] `/etc/bash.bashrc` may already contain content** → The entrypoint appends a focused block rather than overwriting. It guards with a marker comment (`# focus-prompt`) so it does not append twice if the container is restarted without a full rebuild.

**[Risk] Base image may not have `/etc/bash.bashrc`** → `entrypoint.sh` creates the file if it does not exist (the `>>` append operator in bash handles this).

**[Risk] User's `~/.bashrc` resets `PS1` to something that does not call through to `/etc/bash.bashrc` behavior** → This is the expected override path and is explicitly desirable — users who set `PS1` in their own dotfiles (or via a tool profile) get their prompt, not ours.

**[Risk] Non-interactive runs pick up the prompt** → `PS1` is only evaluated in interactive shells. Non-interactive `focus -- <cmd>` runs are unaffected.
