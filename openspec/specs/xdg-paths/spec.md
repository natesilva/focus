# XDG Paths

## Purpose

Resolves XDG Base Directory paths for use by other focus modules, following the XDG Base Directory Specification.

## Requirements

### Requirement: Resolve XDG config home
The system SHALL resolve the XDG config home directory as `$XDG_CONFIG_HOME` when that variable is set and non-empty, otherwise `~/.config`.

#### Scenario: XDG_CONFIG_HOME is set
- **WHEN** `XDG_CONFIG_HOME` is set to a non-empty value
- **THEN** `xdgPaths().configHome` returns that value

#### Scenario: XDG_CONFIG_HOME is absent
- **WHEN** `XDG_CONFIG_HOME` is not set
- **THEN** `xdgPaths().configHome` returns `~/.config` (with `~` expanded to the home directory)

### Requirement: Resolve XDG data home
The system SHALL resolve the XDG data home directory as `$XDG_DATA_HOME` when set and non-empty, otherwise `~/.local/share`.

#### Scenario: XDG_DATA_HOME is set
- **WHEN** `XDG_DATA_HOME` is set to a non-empty value
- **THEN** `xdgPaths().dataHome` returns that value

#### Scenario: XDG_DATA_HOME is absent
- **WHEN** `XDG_DATA_HOME` is not set
- **THEN** `xdgPaths().dataHome` returns `~/.local/share` (expanded)

### Requirement: Resolve XDG cache home
The system SHALL resolve the XDG cache home directory as `$XDG_CACHE_HOME` when set and non-empty, otherwise `~/.cache`.

#### Scenario: XDG_CACHE_HOME is set
- **WHEN** `XDG_CACHE_HOME` is set to a non-empty value
- **THEN** `xdgPaths().cacheHome` returns that value

#### Scenario: XDG_CACHE_HOME is absent
- **WHEN** `XDG_CACHE_HOME` is not set
- **THEN** `xdgPaths().cacheHome` returns `~/.cache` (expanded)

### Requirement: Resolve XDG state home
The system SHALL resolve the XDG state home directory as `$XDG_STATE_HOME` when set and non-empty, otherwise `~/.local/state`.

#### Scenario: XDG_STATE_HOME is set
- **WHEN** `XDG_STATE_HOME` is set to a non-empty value
- **THEN** `xdgPaths().stateHome` returns that value

#### Scenario: XDG_STATE_HOME is absent
- **WHEN** `XDG_STATE_HOME` is not set
- **THEN** `xdgPaths().stateHome` returns `~/.local/state` (expanded)

### Requirement: Expose focus-specific subdirectories
The system SHALL expose the focus-specific subdirectory paths derived from the XDG base directories.

#### Scenario: Focus config dir
- **WHEN** `xdgPaths()` is called
- **THEN** `focusConfigDir` is `<configHome>/focus`

#### Scenario: Focus volumes dir
- **WHEN** `xdgPaths()` is called
- **THEN** `focusVolumesDir` is `<dataHome>/focus/volumes`

#### Scenario: Focus cache dir
- **WHEN** `xdgPaths()` is called
- **THEN** `focusCacheDir` is `<cacheHome>/focus`

#### Scenario: Focus state dir
- **WHEN** `xdgPaths()` is called
- **THEN** `focusStateDir` is `<stateHome>/focus`
