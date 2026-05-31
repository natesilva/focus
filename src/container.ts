import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as docker from './runtime/docker.ts';
import { getHostUid } from './uid.ts';

const IMAGE = 'ubuntu:24.04';

function loadEntrypointScript(): string {
  const path = join(dirname(fileURLToPath(import.meta.url)), 'entrypoint.sh');
  return readFileSync(path, 'utf8');
}

export function containerName(cwd: string): string {
  const hash = createHash('sha256').update(cwd).digest('hex').slice(0, 8);
  return `focus-${hash}`;
}

export async function runContainer(cwd: string, command?: string[]): Promise<number> {
  return docker.start({
    name: containerName(cwd),
    image: IMAGE,
    cwd,
    uid: getHostUid(),
    entrypointScript: loadEntrypointScript(),
    command,
  });
}

export async function stopContainer(cwd: string): Promise<{ stopped: boolean }> {
  return docker.stop(containerName(cwd));
}

export async function containerStatus(cwd: string): Promise<{ running: boolean }> {
  return docker.status(containerName(cwd));
}
