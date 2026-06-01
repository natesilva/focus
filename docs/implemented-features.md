# focus — Implemented Features

Features that originated in `future-features.md` and have since been implemented.

---

## Branded shell prompt

**Implemented:** 2026-06-01

**Context:** Inside the container, the shell prompt looks like any other shell — there is no visual indication that the user is inside a `focus` container. This makes it easy to lose track of context when switching between terminal tabs.

**Suggested approach when revisiting:** Set a default prompt in the container that is visually distinct: colorful, includes `[focus]` or the project name, and clearly signals that this is the focus environment. The prompt should be set in a shell init file (e.g. `/etc/bash_prompt.d/focus.sh` or equivalent for zsh) so it applies to all users and is easy to override in `.bashrc`/`.zshrc`. Consider including the mounted project directory name and the active tool profile set.

**What was built:** At container start, `entrypoint.sh` appends a styled PS1 block to `/etc/bash.bashrc`. The prompt displays `[focus · <project>]` in bold green and the current directory in blue. Two layout styles are supported: `two-line` (default) and `inline`. The prompt can be disabled entirely with `shell: { prompt: false }` in `.focus.yaml`. A marker comment guards against double-injection on container restart.

---

## Tool definitions in YAML (instead of hardcoded)

**Implemented:** 2026-06-01

**Context:** Built-in tool definitions (SSH, Claude, Rust, Node, etc.) are currently defined in source code. User-defined tools use a `.yaml` format for the same information.

**Suggested approach when revisiting:** Extract built-in tool definitions into `.yaml` files that use the same schema as user-defined tools. The loader would read both from a built-ins directory (bundled with the binary) and from user config paths. This would make it easier to add, modify, or override built-in tools without touching source code, and would allow advanced users to override a built-in by name.

**What was built:** Each built-in profile is now a YAML file under `src/profiles/builtins/`. A shared `loadProfilesFromDir` helper (in `src/profiles/loader.ts`) backs both the built-in and custom profile loaders. The resolution order (custom overrides built-in) is unchanged.
