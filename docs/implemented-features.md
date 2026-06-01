# focus — Implemented Features

Features that originated in `future-features.md` and have since been implemented.

---

## Tool definitions in YAML (instead of hardcoded)

**Implemented:** 2026-06-01

**Context:** Built-in tool definitions (SSH, Claude, Rust, Node, etc.) are currently defined in source code. User-defined tools use a `.yaml` format for the same information.

**Suggested approach when revisiting:** Extract built-in tool definitions into `.yaml` files that use the same schema as user-defined tools. The loader would read both from a built-ins directory (bundled with the binary) and from user config paths. This would make it easier to add, modify, or override built-in tools without touching source code, and would allow advanced users to override a built-in by name.

**What was built:** Each built-in profile is now a YAML file under `src/profiles/builtins/`. A shared `loadProfilesFromDir` helper (in `src/profiles/loader.ts`) backs both the built-in and custom profile loaders. The resolution order (custom overrides built-in) is unchanged.
