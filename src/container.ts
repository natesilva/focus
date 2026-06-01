import { createHash } from 'node:crypto';
import { access } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FocusConfig } from './config/resolver.ts';
import { buildImage } from './image-builder.ts';
import type { InspectResult, RuntimeAdapter } from './runtime/adapter.ts';
import { selectRuntime } from './runtime/index.ts';
import { getHostUid } from './uid.ts';
import { resolveFileMounts, resolveProfileVolumes, type MountDescriptor } from './volumes.ts';
import { resolveProfiles } from './profiles/index.ts';
import type { Profile } from './profiles/index.ts';
import { xdgPaths, type XdgPaths } from './config/xdg.ts';

function loadEntrypointScript(): string {
  const path = join(dirname(fileURLToPath(import.meta.url)), 'entrypoint.sh');
  return readFileSync(path, 'utf8');
}

export function containerName(cwd: string): string {
  const hash = createHash('sha256').update(cwd).digest('hex').slice(0, 8);
  return `focus-${hash}`;
}

export function configHash(config: FocusConfig, profiles: Profile[]): string {
  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
  const data = JSON.stringify({
    image: config.image,
    network: config.network,
    profiles: sorted.map(p => ({ name: p.name, install: p.install, files: p.files, volumes: p.volumes })),
  });
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

async function pruneOrphanedContainers(adapter: RuntimeAdapter): Promise<void> {
  const containers = await adapter.listFocusContainers();
  await Promise.all(
    containers.map(async ({ name, cwd }) => {
      try {
        await access(cwd);
      } catch {
        await adapter.stop(name);
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

const TERMINAL_ENV = { TERM: 'xterm-256color', COLORTERM: 'truecolor' };

export function resolvePromptStyle(prompt: NonNullable<FocusConfig['shell']>['prompt']): 'two-line' | 'inline' | 'off' {
  if (prompt === false) return 'off';
  if (typeof prompt === 'object' && prompt.style === 'inline') return 'inline';
  return 'two-line';
}

export async function attachContainer(adapter: RuntimeAdapter, name: string, uid: number, command?: string[]): Promise<number> {
  const tty = command === undefined && process.stdin.isTTY;
  return adapter.exec(name, uid, command, tty, TERMINAL_ENV);
}

export async function buildMounts(profiles: Profile[], xdg: XdgPaths, uid: number): Promise<MountDescriptor[]> {
  const [volumeMounts, fileMounts] = await Promise.all([
    resolveProfileVolumes(profiles, xdg, uid),
    resolveFileMounts(profiles, xdg, uid),
  ]);
  return [...volumeMounts, ...fileMounts];
}

export async function runContainer(cwd: string, config: FocusConfig, command?: string[]): Promise<number> {
  const uid = getHostUid();
  const xdg = xdgPaths();
  const name = containerName(cwd);
  const interactive = command === undefined;

  const adapter = await selectRuntime(config.runtime);

  await pruneOrphanedContainers(adapter);

  const profiles = await resolveProfiles(config.tools, xdg.focusConfigDir);
  const hash = configHash(config, profiles);
  const existing = await adapter.inspect(name);
  const action = resolveRunAction(existing, hash, interactive);

  if (action.type === 'attach') {
    return attachContainer(adapter, name, uid, command);
  }
  if (action.type === 'rebuild-interactive') {
    console.warn('[focus] Container is running with a different config.');
    const rebuild = await promptRebuild();
    if (!rebuild) return 0;
    await adapter.stop(name);
  }
  if (action.type === 'rebuild-auto') {
    process.stderr.write('[focus] Config changed, rebuilding container...\n');
    await adapter.stop(name);
  }

  const [mounts, image] = await Promise.all([
    buildMounts(profiles, xdg, uid),
    buildImage(profiles, config.image, adapter),
  ]);
  return adapter.start({
    name,
    image,
    cwd,
    uid,
    configHash: hash,
    entrypointScript: loadEntrypointScript(),
    command,
    network: config.network === 'none' ? 'none' : undefined,
    mounts,
    env: {
      ...TERMINAL_ENV,
      FOCUS_PROJECT: basename(cwd),
      FOCUS_PROMPT_STYLE: resolvePromptStyle(config.shell?.prompt),
    },
  });
}

export async function stopContainer(cwd: string, config: FocusConfig): Promise<{ stopped: boolean }> {
  const adapter = await selectRuntime(config.runtime);
  return adapter.stop(containerName(cwd));
}

export async function containerStatus(cwd: string, config: FocusConfig): Promise<{ running: boolean; configCurrent: boolean | null }> {
  const adapter = await selectRuntime(config.runtime);
  const name = containerName(cwd);
  const result = await adapter.inspect(name);
  if (!result.running) return { running: false, configCurrent: null };
  const profiles = await resolveProfiles(config.tools, xdgPaths().focusConfigDir);
  const hash = configHash(config, profiles);
  return {
    running: true,
    configCurrent: result.labels['focus.config-hash'] === hash,
  };
}
