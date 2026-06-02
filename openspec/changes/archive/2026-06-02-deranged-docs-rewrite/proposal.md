## Why

The documentation is accurate but utterly forgettable — a trait shared by most documentation and most people. Adding a personality layer (specifically: GlaDOS's passive-aggressive precision meets Carrot Weather's absurdist non-sequiturs) makes the docs memorable, on-brand for a tool built around AI safety theater, and demonstrably more entertaining than the void. The facts stay. The soul gets installed.

## What Changes

- Rewrite `docs/index.md` with a sharper hook and sardonic framing
- Rewrite `docs/about.md` with GlaDOS/Carrot-style voice while preserving all factual content
- Rewrite `docs/getting-started.md` with humorous asides, warnings, and observations that do not impede comprehension
- Rewrite `docs/configuration.md` with deadpan field descriptions and existential table footnotes
- Rewrite `docs/profiles.md` with wry commentary on what each tool does and why you need it in a box
- Rewrite `docs/focus-vs-devcontainers.md` with a comparison that is fair, accurate, and slightly smug
- All docs remain factually correct — the humor augments, never obscures

## Capabilities

### New Capabilities

_(none — this change does not introduce new functional capabilities)_

### Modified Capabilities

- `user-documentation`: Adding a tone and voice requirement. The existing spec defines what the docs must *cover* but says nothing about *how* they should read. We are adding a requirement that documentation voice be distinctive, mildly sardonic, and humanly readable — without sacrificing accuracy or comprehensiveness.

## Impact

- All files in `docs/` (excluding `docs/internal/`) are rewritten
- No code changes, no config changes, no behavior changes
- README.md is not in scope (it faces GitHub; different audience, different stakes)
