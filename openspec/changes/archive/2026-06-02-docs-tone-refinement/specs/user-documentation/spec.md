## MODIFIED Requirements

### Requirement: User-facing documentation has a distinctive voice
All user-facing documentation in `docs/` (excluding `docs/internal/`) SHALL be written in a professional, direct tone with occasional dry wit. The voice SHALL be consistent across all files. Humor is permitted when it arises naturally from the writing, but SHALL NOT be a structural requirement of every paragraph. The documentation SHALL read as competent technical writing with character — not as a comedy vehicle that happens to contain documentation. All factual content, commands, paths, field names, and defaults SHALL remain accurate and complete.

#### Scenario: Commands and paths are unaffected by humor
- **WHEN** a user reads any documentation page
- **THEN** all shell commands, file paths, YAML field names, and default values are accurate and runnable

#### Scenario: Prose is professional and clear
- **WHEN** a user reads any user-facing doc page
- **THEN** the primary reading experience is clear, direct technical writing — not a performance of sardonic wit

#### Scenario: Occasional dry humor is acceptable
- **WHEN** a user reads any user-facing doc page
- **THEN** a dry observation or light quip may appear where it fits naturally, without disrupting the flow of information

#### Scenario: Humor does not displace required information
- **WHEN** a user reads the getting started guide
- **THEN** they can complete a first run of focus without having to decode a joke to find a required command or prerequisite

#### Scenario: Internal docs are not affected
- **WHEN** a user reads any file in `docs/internal/`
- **THEN** the file uses a neutral, factual tone (unchanged from current state)
