## Context

The user-facing docs were rewritten with a heavily sardonic, GlaDOS-inspired voice. The intent was to give focus a distinctive character. In practice, the execution went too far — nearly every paragraph contains a comedic aside, which accumulates into something that reads as effortful rather than charming, and risks putting off professional users who are evaluating the tool.

The existing `user-documentation` spec's voice requirement explicitly mandates the sardonic/absurdist register. Both the spec and the six doc files need to change.

## Goals / Non-Goals

**Goals:**
- Establish a refined voice standard: professional and clear, dry wit welcome, absurdist register retired
- Update the `user-documentation` spec to codify the new standard
- Revise all six user-facing doc files to meet the updated spec

**Non-Goals:**
- Making the docs humorless — a dry observation or light quip is fine when it fits naturally
- Changing any factual content, commands, paths, or technical accuracy
- Touching `docs/internal/` files

## Decisions

**Tone target: professional with occasional dry wit**

The new standard is: write clearly and directly. If something is genuinely amusing to say, say it. But humor should emerge from the writing, not be a structural requirement of every paragraph. Think more "good technical writing with personality" than "GlaDOS narrating a man page."

**Update the spec first, then the docs**

The spec is the source of truth. The implementation task order will be: update `user-documentation` spec delta → revise docs to match.

**No new doc structure**

File organization, required sections, and factual content all stay the same. This is purely a prose revision.

## Risks / Trade-offs

- **Subjectivity risk**: "Professional with personality" is harder to verify than "sardonic." → Mitigation: the updated spec includes concrete scenarios that describe what counts as acceptable and what doesn't.
- **Regression risk**: Revising six files increases the surface area for accidental content changes. → Mitigation: tasks are scoped per-file so each can be reviewed independently.
