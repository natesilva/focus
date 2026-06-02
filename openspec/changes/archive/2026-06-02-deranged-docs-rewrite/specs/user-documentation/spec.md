## ADDED Requirements

### Requirement: User-facing documentation has a distinctive voice
All user-facing documentation in `docs/` (excluding `docs/internal/`) SHALL be written in a sardonic, mildly absurdist voice inspired by GlaDOS (Portal) and Carrot Weather. The voice SHALL be consistent across all files. All factual content, commands, paths, field names, and defaults SHALL remain accurate and complete. Humor SHALL augment comprehension, not impede it — a reader who ignores all comedic elements SHALL still receive correct, complete information.

#### Scenario: Commands and paths are unaffected by humor
- **WHEN** a user reads any documentation page
- **THEN** all shell commands, file paths, YAML field names, and default values are accurate and runnable

#### Scenario: Voice is present across all user-facing docs
- **WHEN** a user reads `docs/index.md`, `docs/about.md`, `docs/getting-started.md`, `docs/configuration.md`, `docs/profiles.md`, or `docs/focus-vs-devcontainers.md`
- **THEN** the prose contains sardonic or absurdist observations consistent with the GlaDOS/Carrot Weather register

#### Scenario: Humor does not displace required information
- **WHEN** a user reads the getting started guide
- **THEN** they can complete a first run of focus without having to decode a joke to find a required command or prerequisite

#### Scenario: Internal docs are not affected
- **WHEN** a user reads any file in `docs/internal/`
- **THEN** the file uses a neutral, factual tone (unchanged from current state)
