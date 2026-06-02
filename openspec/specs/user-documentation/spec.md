# Capability: User Documentation

## Purpose

Defines the structure and content requirements for focus's user-facing documentation, including the organization of the `docs/` directory, a getting started guide, configuration and profile references, and supplementary pages.

## Requirements

### Requirement: Internal docs are separated from user docs
Planning and internal reference documents SHALL be moved to `docs/internal/` so the `docs/` top level contains only user-facing content.

#### Scenario: Internal files relocated
- **WHEN** a user browses `docs/`
- **THEN** they see only user-facing reference files (no plan.md, future-features.md, implemented-features.md, devcontainer-features-research.md at the top level)

#### Scenario: Internal files remain accessible
- **WHEN** a contributor browses `docs/internal/`
- **THEN** they find `design.md`, `plan.md`, `future-features.md`, `implemented-features.md`, and `devcontainer-features-research.md`

### Requirement: Getting started guide exists
A `docs/getting-started.md` file SHALL exist covering prerequisites, installation (with a clearly-labeled TBD placeholder), and a first-run walkthrough.

#### Scenario: Prerequisites per platform
- **WHEN** a user reads the getting started guide
- **THEN** they see distinct prerequisite steps for macOS and Linux/WSL2

#### Scenario: Installation placeholder
- **WHEN** a user reads the installation section
- **THEN** they see a clearly-labeled placeholder indicating the distribution method is TBD

#### Scenario: First-run walkthrough
- **WHEN** a user follows the getting started guide
- **THEN** they can run `focus` immediately in a project directory, with `focus init` available as an optional step to scaffold a `.focus.yaml`

### Requirement: Configuration reference exists
A `docs/configuration.md` file SHALL document all configuration files, their XDG paths, all supported fields, and the precedence order (global → project → CLI flags).

#### Scenario: Global config documented
- **WHEN** a user reads the configuration reference
- **THEN** they see the path, format, and all fields for `~/.config/focus/config.yaml`

#### Scenario: Per-project config documented
- **WHEN** a user reads the configuration reference
- **THEN** they see the path, format, and all fields for `.focus.yaml` with defaults

#### Scenario: XDG paths documented
- **WHEN** a user reads the configuration reference
- **THEN** they see a table of all XDG paths focus uses and their purpose

### Requirement: Profile reference exists
A `docs/profiles.md` file SHALL document the built-in profile catalog and the custom profile format.

#### Scenario: Built-in catalog listed
- **WHEN** a user reads the profiles reference
- **THEN** they see a table of all built-in profiles showing what each installs and what each persists

#### Scenario: Custom profile format documented
- **WHEN** a user reads the profiles reference
- **THEN** they see the YAML schema for a custom profile file and an example

### Requirement: Focus vs. devcontainers comparison exists
A `docs/focus-vs-devcontainers.md` file SHALL briefly explain how focus differs from VS Code Dev Containers.

#### Scenario: Comparison is factual and brief
- **WHEN** a user reads the comparison
- **THEN** they understand the key tradeoffs in one page or less

### Requirement: About page with SDD portfolio note exists
A `docs/about.md` file SHALL state what focus is, acknowledge it was developed using OpenSpec and Spec-Driven Development, and explain its dual role as a useful tool and a portfolio demonstration.

#### Scenario: SDD note present
- **WHEN** a user reads the about page
- **THEN** they see a statement that focus was built using OpenSpec and SDD methodology

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
