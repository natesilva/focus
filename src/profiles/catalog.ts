import type { Profile } from "./types.ts";

export const BUILTIN_PROFILES: readonly Profile[] = [
  {
    name: "git",
    install: [
      "apt-get update -qq",
      "DEBIAN_FRONTEND=noninteractive apt-get install -y git",
      "rm -rf /var/lib/apt/lists/*",
    ],
    volumes: [],
  },
  {
    name: "ripgrep",
    install: [
      "apt-get update -qq",
      "DEBIAN_FRONTEND=noninteractive apt-get install -y ripgrep",
      "rm -rf /var/lib/apt/lists/*",
    ],
    volumes: [],
  },
  {
    name: "ssh",
    install: [
      "apt-get update -qq",
      "DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-client",
      "rm -rf /var/lib/apt/lists/*",
    ],
    volumes: ["ssh"],
  },
  {
    name: "node",
    install: [
      "apt-get update -qq",
      "DEBIAN_FRONTEND=noninteractive apt-get install -y curl ca-certificates",
      "curl -fsSL https://deb.nodesource.com/setup_24.x | bash -",
      "DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs",
      "npm install -g pnpm",
      "rm -rf /var/lib/apt/lists/*",
    ],
    volumes: [],
  },
  {
    name: "python",
    install: [
      "apt-get update -qq",
      "DEBIAN_FRONTEND=noninteractive apt-get install -y python3 python3-pip python3-venv curl",
      "curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh",
      "rm -rf /var/lib/apt/lists/*",
    ],
    volumes: [],
  },
  {
    name: "rust",
    install: [
      "apt-get update -qq",
      "DEBIAN_FRONTEND=noninteractive apt-get install -y rustc cargo",
      "rm -rf /var/lib/apt/lists/*",
    ],
    volumes: [],
  },
  {
    name: "claude-code",
    install: [
      "apt-get update -qq",
      "DEBIAN_FRONTEND=noninteractive apt-get install -y curl ca-certificates",
      "curl -fsSL https://deb.nodesource.com/setup_24.x | bash -",
      "DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs",
      // npm's global prefix install lands claude in /usr/local/bin (on PATH for every
      // user). The curl|bash native installer is per-user and targets $HOME/.local/bin,
      // which is unreachable when building as root but running as the host-UID user.
      "npm install -g @anthropic-ai/claude-code",
      "rm -rf /var/lib/apt/lists/*",
    ],
    volumes: ["claude"],
  },
];

const BUILTIN_MAP: ReadonlyMap<string, Profile> = new Map(
  BUILTIN_PROFILES.map((p) => [p.name, p]),
);

export function getBuiltinProfile(name: string): Profile | undefined {
  return BUILTIN_MAP.get(name);
}
