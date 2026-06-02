## MODIFIED Requirements

### Requirement: Attach to running container via Apple Containers
The Apple Containers runtime adapter SHALL attach to a running container using `container exec`.

#### Scenario: Exec with TTY
- **WHEN** the adapter is asked to exec into a container interactively
- **THEN** it runs `container exec --interactive --tty --user <uid> --workdir /work/<dirname> <name> <cmd>`

#### Scenario: Exec without TTY
- **WHEN** the adapter is asked to exec into a container non-interactively
- **THEN** it runs `container exec --interactive --user <uid> --workdir /work/<dirname> <name> <cmd>` (no `--tty`)
