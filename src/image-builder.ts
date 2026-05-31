import { execFile, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import type { Profile } from './profiles/index.ts';
import { resolveProfiles } from './profiles/index.ts';

const execFileAsync = promisify(execFile);

export function computeTag(profileNames: string[], baseImage: string): string {
  const sorted = [...profileNames].sort();
  const input = baseImage + '\n' + sorted.join('\n');
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 12);
  return `focus-built:${hash}`;
}

export function generateDockerfile(profiles: Profile[], baseImage: string): string {
  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
  const lines = [`FROM ${baseImage}`];
  for (const profile of sorted) {
    lines.push(`RUN ${profile.install.join(' && ')}`);
  }
  return lines.join('\n') + '\n';
}

async function imageExists(tag: string): Promise<boolean> {
  try {
    await execFileAsync('docker', ['image', 'inspect', tag]);
    return true;
  } catch {
    return false;
  }
}

async function runDockerBuild(tag: string, dockerfile: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('docker', ['build', '-t', tag, '-'], {
      stdio: ['pipe', process.stderr, process.stderr],
    });
    const { stdin } = child;
    if (stdin === null) {
      reject(new Error('docker build: stdin stream unavailable'));
      return;
    }
    stdin.write(dockerfile);
    stdin.end();
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`docker build failed with exit code ${code ?? 'null'}`));
    });
    child.on('error', reject);
  });
}

export async function buildImage(profileNames: string[], baseImage: string, configDir: string): Promise<string> {
  if (profileNames.length === 0) {
    return baseImage;
  }

  const sorted = [...profileNames].sort();
  const tag = computeTag(sorted, baseImage);

  if (await imageExists(tag)) {
    return tag;
  }

  const profiles = await resolveProfiles(sorted, configDir);
  const dockerfile = generateDockerfile(profiles, baseImage);
  await runDockerBuild(tag, dockerfile);
  return tag;
}
