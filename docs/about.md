# About focus

`focus` is a CLI tool that launches an isolated container scoped to the current working directory. You're in a project directory, you run `focus`, and you get a clean, reproducible environment with exactly the tools you asked for — no more, no less. Your project files are there, your credentials follow you, and nothing else from your host system leaks in.

---

## Why it exists

AI coding tools like Claude Code are powerful. They're also capable of making sweeping, irreversible changes to your filesystem — either through genuine mistakes or, increasingly, through **prompt injection**: malicious instructions embedded in code you've pulled from GitHub or a package registry, designed to be silently executed by your AI assistant.

The well-established mitigation is to run these tools inside a container. In a container, the worst-case blast radius is bounded: the tool can only see the files you explicitly mounted, and your home directory, your SSH keys, your other projects — none of that is reachable.

The problem is friction. Setting up a proper container environment for each project takes time and expertise. Most projects don't come with one. So in practice, developers often skip the container and run these tools directly on their host machine, accepting the risk because the alternative feels like too much work.

**focus makes the safe path the easy path.** One command — `focus` — and you're in a container. No Dockerfile, no docker-compose, no devcontainer config. The container sees only your current directory. Your tool credentials are mounted from persistent volumes that follow you everywhere. When you exit, the container stops. Your host system remains untouched.

---

## Built with OpenSpec

focus was developed using **[OpenSpec](https://fission.ai/openspec)** and **Spec-Driven Development (SDD)** — a workflow in which features are specified before they're coded, and implementation is verified against the specs.

Every meaningful feature in focus started as a proposal, was refined into a spec, and was implemented against that spec. The planning artifacts live in [`docs/internal/`](internal/) alongside the code.

This project serves two purposes: it's a tool we use daily, and it's a portfolio demonstration of what structured AI-assisted development looks like in practice. If you're curious about the methodology, the specs in `openspec/specs/` show the requirements for each feature.
