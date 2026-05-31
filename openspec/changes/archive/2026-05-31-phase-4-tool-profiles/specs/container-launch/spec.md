## MODIFIED Requirements

### Requirement: Container image is determined by the image builder
The container image used at launch SHALL be the tag returned by the image builder, given `FocusConfig.tools` and `FocusConfig.image` as inputs. When `FocusConfig.tools` is empty, the image builder returns `FocusConfig.image` unchanged and no Docker build is performed.

#### Scenario: Default image when no tools configured
- **WHEN** no tools are specified in global or project config
- **THEN** the container is launched using `ubuntu:24.04` (the default base image, returned by the builder unchanged)

#### Scenario: Built image used when tools configured
- **WHEN** `.focus.yaml` specifies `tools: [git, ripgrep]`
- **THEN** the image builder is invoked with those profiles and the container is launched using the returned `focus-built:<hash>` tag

#### Scenario: Custom image from project config with no tools
- **WHEN** `.focus.yaml` specifies `image: debian:bookworm-slim` and no `tools`
- **THEN** the container is launched using `debian:bookworm-slim` (returned by the builder unchanged)

#### Scenario: Custom base image combined with tools
- **WHEN** `.focus.yaml` specifies both `image: debian:bookworm-slim` and `tools: [ripgrep]`
- **THEN** the image builder uses `debian:bookworm-slim` as the base and the container is launched using the resulting `focus-built:<hash>` tag
