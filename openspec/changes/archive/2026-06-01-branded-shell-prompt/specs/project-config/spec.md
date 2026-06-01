## MODIFIED Requirements

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
