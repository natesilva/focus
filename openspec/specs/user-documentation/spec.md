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
