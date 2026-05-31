import { createHash } from 'node:crypto';
import { access } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FocusConfig } from './config/resolver.ts';
import { buildImage } from './image-builder.ts';
import type { InspectResult } from './runtime/docker.ts';
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

export function configHash(config: FocusConfig): string {
  const sorted = [...config.tools].sort();
  const data = JSON.stringify({ tools: sorted, image: config.image });
  return createHash('sha256').update(data).digest('hex').slice(0, 16);
}

export type RunAction =
  | { type: 'attach' }
  | { type: 'rebuild-interactive' }
  | { type: 'rebuild-auto' }
  | { type: 'launch' };

export function resolveRunAction(inspect: InspectResult, currentHash: string, interactive: boolean): RunAction {
  if (!inspect.running) return { type: 'launch' };
  const existingHash = inspect.labels['focus.config-hash'];
  if (existingHash === currentHash) return { type: 'attach' };
  return interactive ? { type: 'rebuild-interactive' } : { type: 'rebuild-auto' };
}

async function pruneOrphanedContainers(): Promise<void> {
  const containers = await docker.listFocusContainers();
  await Promise.all(
    containers.map(async ({ name, cwd }) => {
      try {
        await access(cwd);
      } catch {
        await docker.stop(name);
      }
    })
  );
}

async function promptRebuild(): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('[focus] Config has changed. Rebuild container? [Y/n] ', (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      resolve(a === '' || a === 'y' || a === 'yes');
    });
  });
}

export async function attachContainer(name: string, uid: number, command?: string[]): Promise<number> {
  const tty = command === undefined && process.stdin.isTTY;
  return docker.exec(name, uid, command, tty);
}

export async function runContainer(cwd: string, config: FocusConfig, command?: string[]): Promise<number> {
  const uid = getHostUid();
  const xdg = xdgPaths();
  const name = containerName(cwd);
  const hash = configHash(config);
  const interactive = command === undefined;

  await pruneOrphanedContainers();

  const existing = await docker.inspect(name);
  const action = resolveRunAction(existing, hash, interactive);

  if (action.type === 'attach') {
    return attachContainer(name, uid, command);
  }
  if (action.type === 'rebuild-interactive') {
    console.warn('[focus] Container is running with a different config.');
    const rebuild = await promptRebuild();
    if (!rebuild) return 0;
    await docker.stop(name);
  }
  if (action.type === 'rebuild-auto') {
    process.stderr.write('[focus] Config changed, rebuilding container...\n');
    await docker.stop(name);
  }

  const [mounts, image] = await Promise.all([
    resolveVolumeMounts(xdg, uid),
    buildImage(config.tools, config.image, xdg.focusConfigDir),
  ]);
  return docker.start({
    name,
    image,
    cwd,
    uid,
    configHash: hash,
    entrypointScript: loadEntrypointScript(),
    command,
    network: config.network === 'none' ? 'none' : undefined,
    mounts,
  });
}

export async function stopContainer(cwd: string): Promise<{ stopped: boolean }> {
  return docker.stop(containerName(cwd));
}

export async function containerStatus(cwd: string, config: FocusConfig): Promise<{ running: boolean; configCurrent: boolean | null }> {
  const name = containerName(cwd);
  const result = await docker.inspect(name);
  if (!result.running) return { running: false, configCurrent: null };
  const hash = configHash(config);
  return {
    running: true,
    configCurrent: result.labels['focus.config-hash'] === hash,
  };
}
