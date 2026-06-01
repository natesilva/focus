# Project Config

## Purpose

Defines loading and validation of the per-project `.focus.yaml` configuration file.

## Requirements

### Requirement: Load project config file
The system SHALL load the per-project config file from `.focus.yaml` in the specified directory and validate it against the project config schema.

#### Scenario: File exists and is valid
- **WHEN** `.focus.yaml` exists in the project directory and contains valid YAML matching the schema
- **THEN** the parsed config object is returned

#### Scenario: File does not exist
- **WHEN** `.focus.yaml` does not exist in the project directory
- **THEN** the system returns `null` without error (absence is not an error)

#### Scenario: File exists but is invalid
- **WHEN** `.focus.yaml` exists but contains invalid YAML or fails schema validation
- **THEN** the system throws an error describing the validation failure

### Requirement: Project config schema
The project config file SHALL support the following optional fields:

| Field | Type | Description |
|---|---|---|
| `runtime` | `"auto" \| "docker" \| "apple-containers"` | Runtime override for this project |
| `tools` | `string[]` | Tool list for this project (replaces global default) |
| `image` | `string` | Base container image override |
| `network` | `"bridge" \| "none"` | Network mode (`none` for air-gapped) |
| `shell` | `{ prompt?: boolean \| { style: "inline" \| "two-line" } }` | Shell behavior configuration |

The `shell.prompt` field controls the branded prompt injection:
- `true` (default when `shell` is absent): prompt enabled with `two-line` style
- `false`: prompt disabled; base image default prompt is used
- `{ style: "inline" }`: prompt enabled, single-line layout
- `{ style: "two-line" }`: prompt enabled, two-line layout (explicit)

#### Scenario: Subset of fields present
- **WHEN** `.focus.yaml` contains only some fields (e.g., just `tools`)
- **THEN** the returned object contains only those fields; absent fields are `undefined`

#### Scenario: network none
- **WHEN** `.focus.yaml` contains `network: none`
- **THEN** the returned object has `network: "none"`

#### Scenario: shell.prompt false
- **WHEN** `.focus.yaml` contains `shell: { prompt: false }`
- **THEN** the returned config has `shell.prompt` equal to `false`

#### Scenario: shell.prompt inline style
- **WHEN** `.focus.yaml` contains `shell: { prompt: { style: "inline" } }`
- **THEN** the returned config has `shell.prompt.style` equal to `"inline"`

#### Scenario: shell absent
- **WHEN** `.focus.yaml` does not contain a `shell` key
- **THEN** the returned config has `shell` as `undefined`, and the system applies the default (two-line prompt)

#### Scenario: Unknown field
- **WHEN** `.focus.yaml` contains an unrecognized key
- **THEN** the system throws a validation error (strict parsing, no extra keys silently ignored)
