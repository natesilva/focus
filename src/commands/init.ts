import { access, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SCAFFOLD = `# focus project configuration
# All fields are optional. Absent fields inherit from ~/.config/focus/config.yaml or built-in defaults.

# tools:
#   - git
#   - ripgrep
#   - node
#   - claude-code

# runtime: auto   # auto | docker | apple-containers

# image: ubuntu:24.04

# network: bridge  # bridge | none (use none for air-gapped environments)
`;

export async function focusInit(cwd: string): Promise<void> {
  const path = join(cwd, '.focus.yaml');

  try {
    await access(path);
    console.error('focus: .focus.yaml already exists');
    process.exit(1);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }

  await writeFile(path, SCAFFOLD, 'utf8');
  console.log('Created .focus.yaml');
}
