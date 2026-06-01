## ADDED Requirements

### Requirement: Container launch sets terminal environment variables
Every container launched by focus SHALL have `TERM` set to `xterm-256color` and `COLORTERM` set to `truecolor` in its environment, regardless of the host terminal settings.

#### Scenario: TERM and COLORTERM present in launched container
- **WHEN** a container is launched
- **THEN** the environment inside the container includes `TERM=xterm-256color` and `COLORTERM=truecolor`

#### Scenario: Interactive tools render color
- **WHEN** a tool inside the container queries `TERM` or `COLORTERM` to determine color support
- **THEN** the values indicate a 24-bit color terminal, enabling full color output
