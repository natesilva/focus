# Config Resolver

## Purpose

Merges global config, project config, and CLI flag overrides into a single resolved `FocusConfig` object for use at runtime.

## Requirements

### Requirement: Merge global and project config into FocusConfig
The config resolver SHALL merge the global config, optional project config, and optional CLI flag overrides into a single `FocusConfig` object using the precedence: global defaults < project config < CLI flags.

#### Scenario: No project config, no flags
- **WHEN** the resolver is called with global config and no project config or flags
- **THEN** `FocusConfig` reflects the global config values

#### Scenario: Project config overrides global
- **WHEN** both global config and project config set `runtime`, and they differ
- **THEN** `FocusConfig.runtime` takes the project config value

#### Scenario: CLI flags override project config
- **WHEN** both project config and CLI flags specify `runtime`, and they differ
- **THEN** `FocusConfig.runtime` takes the CLI flag value

#### Scenario: Partial project config
- **WHEN** project config sets only `tools` (other fields absent)
- **THEN** `tools` comes from project config and all other fields come from global defaults

### Requirement: FocusConfig type
`FocusConfig` SHALL be a fully resolved type with no optional fields — every field has a concrete value after merging.

#### Scenario: All fields populated
- **WHEN** the resolver completes
- **THEN** `FocusConfig` has `runtime`, `tools`, `image`, and `network` all set to non-undefined values

### Requirement: Resolver reads config from correct paths
The resolver SHALL use the XDG path resolution to locate the global config file and accept the project directory as a parameter to locate `.focus.yaml`.

#### Scenario: Resolve called with project directory
- **WHEN** `resolveConfig(projectDir)` is called
- **THEN** it loads the global config from `<xdgPaths().focusConfigDir>/config.yaml` and the project config from `<projectDir>/.focus.yaml`
