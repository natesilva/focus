# Dev Container Features — Research Notes

## Context

Dev Container Features (`containers.dev/features`) are self-contained install scripts with a JSON metadata schema. This note captures whether they're worth borrowing from for focus's Phase 4 tool profiles.

## What Features Are

Each Feature is a shell script + `devcontainer-feature.json` that installs a tool into a dev container. The metadata declares:

- `mounts` — volumes or bind mounts the tool needs
- `containerEnv` — environment variables to set
- `capAdd` — Linux capabilities required
- `options` — user-configurable parameters

The public registry has hundreds of entries covering common tools: git, SSH, Docker-in-Docker, AWS CLI, Node, Python, etc.

## Where Focus and Features Diverge

Features are about **installation** — they run shell scripts to put tools into an image at build or startup time.

Focus tool profiles are about **persistent configuration** — mounting existing host credentials and state (SSH keys, Claude auth, etc.) into a running container via XDG data volumes.

These are complementary, not the same.

## What's Worth Borrowing

**The tool inventory.** The registry is a well-curated list of which CLI tools need special container treatment. Useful as a starting checklist when deciding which tools focus should ship built-in profiles for.

**The `mounts` / `containerEnv` vocabulary.** The metadata schema already has the right fields for expressing what a tool needs. Borrowing this vocabulary for focus profile definitions would align with something developers already know, and each published feature encodes community knowledge about the correct mount paths and env vars for a given tool.

**Specific features to study:**

| Feature | Why interesting |
|---|---|
| `devcontainers/features/git` | SSH key handling, gitconfig mount |
| `devcontainers/features/common-utils` | Shell config, user setup patterns |
| `devcontainers/features/aws-cli` | Credential file mount (`~/.aws`) |
| `devcontainers/features/docker-outside-of-docker` | Socket mount, group membership |
| `devcontainers/features/sshd` | SSH agent forwarding approach |

## Open Questions

- Should focus profile definitions use the Feature schema directly, a subset of it, or just take inspiration?
- Is there value in focus being able to *consume* a Feature (run its install script) to populate a persistent volume on first use?
- The Feature spec allows `options` — does focus need user-configurable parameters per tool profile?

## References

- Spec: <https://containers.dev/implementors/features/>
- Registry: <https://containers.dev/features>
- Schema: <https://containers.dev/implementors/features/#devcontainer-feature-json-properties>
