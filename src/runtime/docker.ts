import type { ExecFileException } from 'node:child_process';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import type { MountDescriptor } from '../volumes.ts';
import type { RuntimeAdapter, StartOptions, InspectResult } from './adapter.ts';

export type { StartOptions, InspectResult } from './adapter.ts';

const execFileAsync = promisify(execFile);

export function buildVolumeFlags(mounts: MountDescriptor[]): string[] {
  return mounts.flatMap(m =>
    ['-v', `${m.hostPath}:${m.containerPath}${m.readOnly ? ':ro' : ''}`]
  );
}

export function buildExecArgs(name: string, uid: number, command: string[] | undefined, tty: boolean): string[] {
  const cmd = command ?? ['/bin/bash'];
  const ttyFlags = tty ? ['-it'] : ['-i'];
  return ['exec', '--user', String(uid), '--workdir', '/focus', ...ttyFlags, name, ...cmd];
}

export function parseInspectOutput(json: string): InspectResult {
  type InspectData = { State: { Running: boolean }; Config: { Labels: Record<string, string> | null } };
  const data = JSON.parse(json) as InspectData;
  return {
    running: data.State.Running,
    labels: data.Config.Labels ?? {},
  };
}

export function parseContainerList(names: string[], inspectJson: string): Array<{ name: string; cwd: string }> {
  if (names.length === 0) return [];
  type InspectEntry = { Name: string; Config: { Labels: Record<string, string> } };
  const containers = JSON.parse(inspectJson) as InspectEntry[];
  return containers
    .map(c => ({
      name: c.Name.replace(/^\//, ''),
      cwd: c.Config.Labels['focus.cwd'] ?? '',
    }))
    .filter(c => c.cwd !== '');
}

export async function start(opts: StartOptions): Promise<number> {
  const { name, image, cwd, uid, configHash, entrypointScript, command, network, mounts } = opts;
  const interactive = command === undefined;
  const ttyFlags = interactive && process.stdin.isTTY ? ['-it'] : ['-i'];
  const networkFlags = network === 'none' ? ['--network', 'none'] : [];
  const volumeFlags = buildVolumeFlags(mounts ?? []);

  // Pass the entrypoint script inline via `bash -c` so no host-path mounting is needed.
  // `bash -c SCRIPT argv0 [args...]` sets $0=argv0, $@=args.
  const args = [
    'run',
    '--rm',
    '--name', name,
    '--label', `focus.cwd=${cwd}`,
    '--label', `focus.config-hash=${configHash}`,
    ...ttyFlags,
    ...networkFlags,
    '-v', `${cwd}:/focus`,
    ...volumeFlags,
    '-e', `FOCUS_UID=${uid}`,
    image,
    '/bin/bash', '-c', entrypointScript, 'focus-entrypoint',
    ...(command ?? []),
  ];

  return new Promise((resolve) => {
    const child = spawn('docker', args, { stdio: 'inherit' });
    child.on('close', (code: number | null) => resolve(code ?? 1));
  });
}

export async function exec(name: string, uid: number, command: string[] | undefined, tty: boolean): Promise<number> {
  const args = buildExecArgs(name, uid, command, tty);
  return new Promise((resolve) => {
    const child = spawn('docker', args, { stdio: 'inherit' });
    child.on('close', (code: number | null) => resolve(code ?? 1));
  });
}

export async function inspect(name: string): Promise<InspectResult> {
  try {
    const { stdout } = await execFileAsync('docker', [
      'inspect', '--format', '{{json .}}', name,
    ]);
    return parseInspectOutput(stdout.trim());
  } catch {
    return { running: false, labels: {} };
  }
}

export async function listFocusContainers(): Promise<Array<{ name: string; cwd: string }>> {
  try {
    const { stdout } = await execFileAsync('docker', [
      'ps', '--filter', 'label=focus.cwd', '--format', '{{.Names}}',
    ]);
    const names = stdout.trim().split('\n').filter(Boolean);
    if (names.length === 0) return [];
    const { stdout: inspectOut } = await execFileAsync('docker', ['inspect', ...names]);
    return parseContainerList(names, inspectOut);
  } catch {
    return [];
  }
}

export async function stop(name: string): Promise<{ stopped: boolean }> {
  try {
    await execFileAsync('docker', ['stop', name]);
    return { stopped: true };
  } catch (err) {
    const stderr = (err as ExecFileException).stderr ?? '';
    if (stderr.includes('No such container')) {
      return { stopped: false };
    }
    throw err;
  }
}

export class DockerRuntimeAdapter implements RuntimeAdapter {
  start(opts: StartOptions): Promise<number> { return start(opts); }
  exec(name: string, uid: number, command: string[] | undefined, tty: boolean): Promise<number> { return exec(name, uid, command, tty); }
  inspect(name: string): Promise<InspectResult> { return inspect(name); }
  stop(name: string): Promise<{ stopped: boolean }> { return stop(name); }
  listFocusContainers(): Promise<Array<{ name: string; cwd: string }>> { return listFocusContainers(); }

  async imageExists(tag: string): Promise<boolean> {
    try {
      await execFileAsync('docker', ['image', 'inspect', tag]);
      return true;
    } catch {
      return false;
    }
  }

  async buildImage(tag: string, dockerfile: string): Promise<void> {
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
}

