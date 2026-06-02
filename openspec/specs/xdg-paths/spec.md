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

### Requirement: Ensure focus XDG directories exist
The system SHALL provide an `ensureXdgDirs()` function that creates the full focus XDG directory tree idempotently. The function SHALL use `{ recursive: true }` so it is safe to call on every invocation regardless of whether the directories already exist.

The directories created SHALL be:
- `<focusConfigDir>/` (`~/.config/focus/`)
- `<focusConfigDir>/profiles/` (`~/.config/focus/profiles/`)
- `<focusVolumesDir>/` (`~/.local/share/focus/volumes/`)
- `<focusCacheDir>/` (`~/.cache/focus/`)
- `<focusStateDir>/` (`~/.local/state/focus/`)

#### Scenario: Directories do not exist
- **WHEN** `ensureXdgDirs()` is called and none of the focus XDG directories exist
- **THEN** all five directories are created

#### Scenario: Directories already exist
- **WHEN** `ensureXdgDirs()` is called and the focus XDG directories already exist
- **THEN** the call succeeds without error and the existing directories are unchanged

#### Scenario: Partial tree exists
- **WHEN** `ensureXdgDirs()` is called and some directories exist and others do not
- **THEN** the missing directories are created and the existing directories are unchanged

### Requirement: CLI calls ensureXdgDirs on startup
The CLI entrypoint SHALL call `ensureXdgDirs()` once at the start of `main()`, before any subcommand logic runs, so the directory tree is always present when subcommands attempt to read from XDG paths.

#### Scenario: Any subcommand
- **WHEN** the user runs any `focus` subcommand (`run`, `stop`, `status`, `init`, `--`)
- **THEN** `ensureXdgDirs()` is called before the subcommand handler executes
