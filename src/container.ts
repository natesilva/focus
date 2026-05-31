import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FocusConfig } from './config/resolver.ts';
import { buildImage } from './image-builder.ts';
import * as docker from './runtime/docker.ts';
import { getHostUid } from './uid.ts';
import { resolveVolumeMounts } from './volumes.ts';
import { xdgPaths } from './config/xdg.ts';

function loadEntrypointScript(): string {
  const path = join(dirname(fileURLToPath(import.meta.url)), 'entrypoint.sh');
  return readFileSync(path, 'utf8');
}

export function containerName(cwd: string): string {
  const hash = createHash('sha256').update(cwd).digest('hex').slice(0, 8);
  return `focus-${hash}`;
}

export async function runContainer(cwd: string, config: FocusConfig, command?: string[]): Promise<number> {
  const uid = getHostUid();
  const xdg = xdgPaths();
  const [mounts, image] = await Promise.all([
    resolveVolumeMounts(xdg, uid),
    buildImage(config.tools, config.image, xdg.focusConfigDir),
  ]);
  return docker.start({
    name: containerName(cwd),
    image,
    cwd,
    uid,
    entrypointScript: loadEntrypointScript(),
    command,
    network: config.network === 'none' ? 'none' : undefined,
    mounts,
  });
}

export async function stopContainer(cwd: string): Promise<{ stopped: boolean }> {
  return docker.stop(containerName(cwd));
}

export async function containerStatus(cwd: string): Promise<{ running: boolean }> {
  return docker.status(containerName(cwd));
}
