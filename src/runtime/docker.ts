import type { ExecFileException } from 'node:child_process';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import type { MountDescriptor } from '../volumes.ts';

const execFileAsync = promisify(execFile);

export type ContainerStatus = { running: boolean };

export interface StartOptions {
  name: string;
  image: string;
  cwd: string;
  uid: number;
  entrypointScript: string;
  command?: string[];
  network?: 'none';
  mounts?: MountDescriptor[];
}

export function buildVolumeFlags(mounts: MountDescriptor[]): string[] {
  return mounts.flatMap(m =>
    ['-v', `${m.hostPath}:${m.containerPath}${m.readOnly ? ':ro' : ''}`]
  );
}

export async function start(opts: StartOptions): Promise<number> {
  const { name, image, cwd, uid, entrypointScript, command, network, mounts } = opts;
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

export async function status(name: string): Promise<ContainerStatus> {
  try {
    const { stdout } = await execFileAsync('docker', [
      'inspect', '--format', '{{.State.Running}}', name,
    ]);
    return { running: stdout.trim() === 'true' };
  } catch {
    return { running: false };
  }
}
