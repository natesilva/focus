## Context

The existing `docs/` files (index, about, getting-started, configuration, profiles, focus-vs-devcontainers) are accurate and complete but written in a neutral technical register. The tool's subject matter — running AI agents in an isolation box, because you don't fully trust them — has inherent comedic potential that the current docs don't exploit. This change introduces a distinct voice without altering information architecture, file structure, or factual content.

Voice references:
- **GlaDOS** (Portal): Calm, precise, passive-aggressive, vaguely menacing, addresses the reader as a test subject navigating a system they don't fully understand. States obvious things as if they're revelations. Expresses concern in a way that makes you feel worse.
- **Carrot Weather**: Non-sequiturs, existential observations, absurdist warnings about mundane things, surprising pivots that somehow still inform. Doesn't condescend — just *narrates* in a way that suggests it has seen things.

## Goals / Non-Goals

**Goals:**
- Every user-facing doc in `docs/` gets rewritten with the target voice
- All factual content (commands, paths, field names, defaults, behavior) is preserved exactly
- Tone is consistent across all six files
- Humor augments comprehension — it does not compete with it

**Non-Goals:**
- `README.md` — faces GitHub, broad audience, different conventions; not touched
- `docs/internal/` — planning artifacts, not user docs; not touched
- Code changes of any kind
- Adding new factual content beyond what currently exists

## Decisions

### Voice: sardonic-accurate, not parody
The docs must remain *usable*. The humor lives in framing, asides, word choice, and occasional parenthetical observations — not in obscuring commands or replacing field names with jokes. A reader who skips every humorous line should still get correct, complete information.

**Considered alternatives:**
- Full GlaDOS parody (all ominous, all the time) — rejected; would exhaust the reader and undermine trust
- Carrot Weather only — rejected; the GlaDOS register suits the "AI isolation box" framing better as a throughline, with Carrot-style non-sequiturs as seasoning
- Just add a funny intro paragraph to each file — rejected; doesn't achieve the personality goal at the cost it deserves

### File-by-file approach, no shared templates
Each file has a different rhetorical purpose. `getting-started.md` needs to onboard someone who just installed the tool; `focus-vs-devcontainers.md` needs to compare two things fairly. The humor in each file should fit its purpose — no copy-paste tone from a shared template.

### Maintain all headings and structural markers
The file structure (headings, tables, code blocks) stays intact. This keeps docs navigable and avoids breaking any downstream rendering or linking. The humor lives in prose, not structure.

## Risks / Trade-offs

- **Risk: Humor doesn't land, reads as unprofessional** → Mitigation: keep factual density high; a humorless reader still gets the docs they need
- **Risk: Voice inconsistency across files** → Mitigation: tasks file references both source voices explicitly; implementer should read all files before writing any
- **Risk: Jokes age poorly** → Mitigation: avoid topical references; lean on structural/observational humor that's timeless ("you are trusting this tool with your files" is always true)

## Open Questions

None. This is a pure content rewrite with no architectural decisions pending.
