# Profile Prerequisites

## Purpose

Defines how profiles declare dependencies on other profiles, how those dependencies are resolved transitively, and how the resolved ordered list is computed for install-time use.

## Requirements

### Requirement: Prerequisites field in profile schema
A profile definition MAY declare a `prerequisites` field containing an ordered list of profile names that must be installed before this profile. The field is optional and defaults to an empty list.

#### Scenario: Profile with prerequisites field is valid
- **WHEN** a profile YAML file contains `prerequisites: [node]`
- **THEN** validation succeeds and the profile's prerequisites list contains `"node"`

#### Scenario: Profile without prerequisites field defaults to empty list
- **WHEN** a profile YAML file omits the `prerequisites` field
- **THEN** validation succeeds and the profile's prerequisites list is `[]`

#### Scenario: Prerequisites field with unknown profile name is allowed at load time
- **WHEN** a profile YAML file declares `prerequisites: [nonexistent]`
- **THEN** the profile loads successfully (prerequisite validity is checked at resolve time, not load time)

### Requirement: Transitive prerequisite expansion
When resolving a set of profiles, the system SHALL compute the transitive closure of all prerequisites. If profile A requires B, and B requires C, then resolving `[A]` produces `[A, B, C]`.

#### Scenario: Direct prerequisite auto-injected
- **WHEN** `resolveProfiles(["claude-code"])` is called and `claude-code` declares `prerequisites: [node]`
- **THEN** the resolved set includes both `claude-code` and `node`

#### Scenario: Transitive prerequisite auto-injected
- **WHEN** `resolveProfiles(["A"])` is called, `A` has `prerequisites: [B]`, and `B` has `prerequisites: [C]`
- **THEN** the resolved set includes `A`, `B`, and `C`

#### Scenario: Duplicate prerequisites deduplicated
- **WHEN** two requested profiles each declare the same prerequisite
- **THEN** the resolved set contains that prerequisite only once

#### Scenario: Explicitly listed prerequisite not duplicated
- **WHEN** `resolveProfiles(["claude-code", "node"])` is called and `claude-code` declares `prerequisites: [node]`
- **THEN** the resolved set contains `node` exactly once

### Requirement: Auto-injection informational output
When a profile is added to the resolved set because it is a prerequisite (not because the user listed it), the system SHALL print an informational line to stderr for each auto-injected profile. Each line SHALL identify the injected profile name and the profile that required it.

#### Scenario: Informational line printed for auto-injected prerequisite
- **WHEN** `resolveProfiles(["claude-code"])` is called and `node` is auto-injected as a prerequisite
- **THEN** a line matching `note: adding "node" (required by claude-code)` is printed to stderr

#### Scenario: No informational line when prerequisite is explicitly listed
- **WHEN** `resolveProfiles(["claude-code", "node"])` is called
- **THEN** no informational line is printed for `node`

#### Scenario: Informational line printed once per auto-injected profile
- **WHEN** two profiles share the same prerequisite and it is auto-injected
- **THEN** the informational line for that prerequisite appears exactly once

### Requirement: Missing prerequisite detection
If a profile declares a prerequisite whose name does not exist in the merged profile catalog (built-ins + custom), the system SHALL throw an error at resolve time. The error SHALL identify both the declaring profile and the missing prerequisite name.

#### Scenario: Missing prerequisite throws at resolve time
- **WHEN** `resolveProfiles(["some-tool"])` is called and `some-tool` declares `prerequisites: [nonexistent]`
- **THEN** the system throws an error naming `some-tool` and `nonexistent`

#### Scenario: Valid prerequisite does not throw
- **WHEN** `resolveProfiles(["claude-code"])` is called and `node` exists in the catalog
- **THEN** no error is thrown

### Requirement: Cycle detection
If the prerequisite graph contains a circular dependency chain, the system SHALL detect it and throw an error. The error SHALL include the full cycle path.

#### Scenario: Direct cycle throws
- **WHEN** profile A declares `prerequisites: [B]` and profile B declares `prerequisites: [A]`
- **THEN** `resolveProfiles(["A"])` throws an error identifying the cycle

#### Scenario: Indirect cycle throws
- **WHEN** A → B → C → A form a cycle
- **THEN** `resolveProfiles(["A"])` throws an error identifying the cycle

#### Scenario: Acyclic graph does not throw
- **WHEN** the prerequisite graph has no cycles
- **THEN** `resolveProfiles` completes without error

### Requirement: Topological install order
The resolved profile list returned by `resolveProfiles` SHALL be in topological order: for any profile P that declares a prerequisite Q, Q SHALL appear before P in the returned list. Within a set of profiles that have no ordering constraint between them, profiles SHALL be sorted alphabetically by name for determinism.

#### Scenario: Prerequisite appears before dependent in resolved list
- **WHEN** `resolveProfiles(["claude-code"])` is called and `claude-code` declares `prerequisites: [node]`
- **THEN** `node` appears before `claude-code` in the returned list

#### Scenario: Profiles with no dependency constraints sorted alphabetically
- **WHEN** `resolveProfiles(["ripgrep", "git"])` is called and neither declares prerequisites
- **THEN** the returned list is `[git, ripgrep]` (alphabetical order)

#### Scenario: Input order does not affect resolved order
- **WHEN** `resolveProfiles(["claude-code", "git"])` and `resolveProfiles(["git", "claude-code"])` are both called
- **THEN** both return the same ordered list
