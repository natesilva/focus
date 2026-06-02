## ADDED Requirements

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
