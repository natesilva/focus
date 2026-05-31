# Global Config

## Purpose

Defines loading and validation of the user-level global configuration file for focus.

## Requirements

### Requirement: Load global config file
The system SHALL load the global config file from `<focusConfigDir>/config.yaml` and validate it against the global config schema.

#### Scenario: File exists and is valid
- **WHEN** `~/.config/focus/config.yaml` exists and contains valid YAML matching the schema
- **THEN** the parsed config object is returned

#### Scenario: File does not exist
- **WHEN** `~/.config/focus/config.yaml` does not exist
- **THEN** the system returns a default global config object without error

#### Scenario: File exists but is invalid
- **WHEN** `~/.config/focus/config.yaml` exists but contains invalid YAML or fails schema validation
- **THEN** the system throws an error describing the validation failure

### Requirement: Global config schema
The global config file SHALL support the following optional fields with defaults:

| Field | Type | Default | Description |
|---|---|---|---|
| `runtime` | `"auto" \| "docker" \| "apple-containers"` | `"auto"` | Preferred container runtime |
| `tools` | `string[]` | `[]` | Default tool list for all projects |
| `image` | `string` | `"ubuntu:24.04"` | Base container image |

#### Scenario: All fields present
- **WHEN** the config file contains `runtime`, `tools`, and `image` fields with valid values
- **THEN** all fields are reflected in the returned config object

#### Scenario: Empty file or missing fields
- **WHEN** the config file is empty or omits some fields
- **THEN** the returned object uses default values for all omitted fields

#### Scenario: Unknown runtime value
- **WHEN** the config file contains `runtime: "podman"` (an unrecognized value)
- **THEN** the system throws a validation error
