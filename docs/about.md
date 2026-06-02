# About focus

`focus` is a CLI tool that launches an isolated container scoped to the current working directory. You're in a project directory, you run `focus`, and you get a clean, reproducible environment with exactly the tools you asked for — no more, no less. Your project files are there, your credentials follow you, and nothing else from your host system leaks in.

This is, by the way, how software is supposed to work. We mention this only because it's become surprisingly rare.

---

## Why it exists

AI coding tools like Claude Code are powerful. They are also — and we want to be precise here — capable of making sweeping, irreversible changes to your filesystem. Through genuine mistakes. Or, increasingly, through **prompt injection**: malicious instructions embedded in code you've pulled from GitHub or a package registry, crafted to be silently executed by your AI assistant while it cheerfully believes it's helping.

The technical term for this is "a problem." The well-established mitigation is to run these tools inside a container. In a container, the worst-case blast radius is bounded: the tool can only see the files you explicitly mounted, and your home directory, your SSH keys, your other projects, your extremely well-named folder called `important-things` — none of that is reachable.

The practical problem is friction. Setting up a proper container environment for each project takes time and expertise. Most projects don't come with one. So in practice, developers often skip the container and run these tools directly on their host machine, accepting the risk because the alternative is forty minutes of Dockerfile archaeology.

**focus makes the safe path the easy path.** One command — `focus` — and you're in a container. No Dockerfile, no docker-compose, no devcontainer config, no reading the documentation for an hour only to discover you needed a different version of the documentation. The container sees only your current directory. Your tool credentials are mounted from persistent volumes that follow you everywhere. When you exit, the container stops. Your host system remains untouched, blissfully unaware of what almost happened.

---

## Built with OpenSpec

`focus` was developed using **[OpenSpec](https://fission.ai/openspec)** and **Spec-Driven Development (SDD)** — a workflow in which features are specified before they're coded, and implementation is verified against the specs. This is the software engineering equivalent of measuring twice and cutting once, except the measuring is done by a large language model and the cutting sometimes requires a follow-up conversation.

Every meaningful feature in `focus` started as a proposal, was refined into a spec, and was implemented against that spec. The planning artifacts live in [`docs/internal/`](internal/) alongside the code. You're welcome to read them. They contain a surprising amount of decisions about directory names.

This project serves two purposes: it's a tool we use daily, and it's a portfolio demonstration of what structured AI-assisted development looks like in practice. If you're curious about the methodology, the specs in `openspec/specs/` show the requirements for each feature, written with the confidence of someone who has not yet discovered what implementing them actually involves.
