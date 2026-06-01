import type { ExecFileException } from 'node:child_process';
import { execFile, spawn } from 'node:child_process';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import type { RuntimeAdapter, StartOptions, InspectResult } from './adapter.ts';
import { FocusError } from '../errors.ts';

const execFileAsync = promisify(execFile);

// JSON shape emitted by `container list --format json` and `container inspect`
type PrintableContainer = {
  status: string;
  configuration: {
    id: string;
    labels: Record<string, string>;
  };
};

export function parseInspectOutput(json: string): InspectResult {
  const data = JSON.parse(json) as PrintableContainer[];
  if (data.length === 0) return { running: false, labels: {} };
  const c = data[0];
  return {
    running: c.status === 'running',
    labels: c.configuration.labels ?? {},
  };
}

export function parseContainerList(json: string): Array<{ name: string; cwd: string }> {
  const data = JSON.parse(json) as PrintableContainer[];
  return data
    .filter(c => 'focus.cwd' in c.configuration.labels)
    .map(c => ({
      name: c.configuration.id,
      cwd: c.configuration.labels['focus.cwd'],
    }));
}

export class AppleContainersRuntimeAdapter implements RuntimeAdapter {
  async start(opts: StartOptions): Promise<number> {
    const { name, image, cwd, uid, configHash, entrypointScript, command, mounts, env } = opts;
    const interactive = command === undefined;
    const ttyFlags = interactive && process.stdin.isTTY
      ? ['--interactive', '--tty']
      : ['--interactive'];
    const volumeFlags = (mounts ?? []).flatMap(m =>
      ['-v', `${m.hostPath}:${m.containerPath}${m.readOnly ? ':ro' : ''}`]
    );
    const envFlags = env ? Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]) : [];

    // Pass the entrypoint script inline via `bash -c` so no host-path mounting is needed.
    // `bash -c SCRIPT argv0 [args...]` sets $0=argv0, $@=args.
    const args = [
      'run',
      '--rm',
      '--name', name,
      '--label', `focus.cwd=${cwd}`,
      '--label', `focus.config-hash=${configHash}`,
      ...ttyFlags,
      '-v', `${cwd}:/focus`,
      ...volumeFlags,
      '-e', `FOCUS_UID=${uid}`,
      ...envFlags,
      image,
      '/bin/bash', '-c', entrypointScript, 'focus-entrypoint',
      ...(command ?? []),
    ];

    return new Promise((resolve, reject) => {
      const child = spawn('container', args, { stdio: 'inherit' });
      child.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
          reject(new FocusError('Apple Containers not found. This runtime requires macOS 26 (Tahoe) or later. Set runtime: docker in your config to use a Docker-compatible runtime instead.'));
        } else {
          reject(err);
        }
      });
      child.on('close', (code: number | null) => resolve(code ?? 1));
    });
  }

  async exec(name: string, uid: number, command: string[] | undefined, tty: boolean, env?: Record<string, string>): Promise<number> {
    const cmd = command ?? ['/bin/bash'];
    const ttyFlags = tty ? ['--interactive', '--tty'] : ['--interactive'];
    const envFlags = env ? Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]) : [];
    const args = ['exec', ...ttyFlags, '--user', String(uid), '--workdir', '/focus', ...envFlags, name, ...cmd];

    return new Promise((resolve, reject) => {
      const child = spawn('container', args, { stdio: 'inherit' });
      child.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
          reject(new FocusError('Apple Containers not found. This runtime requires macOS 26 (Tahoe) or later. Set runtime: docker in your config to use a Docker-compatible runtime instead.'));
        } else {
          reject(err);
        }
      });
      child.on('close', (code: number | null) => resolve(code ?? 1));
    });
  }

  async inspect(name: string): Promise<InspectResult> {
    try {
      const { stdout } = await execFileAsync('container', ['inspect', name]);
      return parseInspectOutput(stdout.trim());
    } catch {
      return { running: false, labels: {} };
    }
  }

  async stop(name: string): Promise<{ stopped: boolean }> {
    try {
      await execFileAsync('container', ['stop', name]);
      return { stopped: true };
    } catch (err) {
      const stderr = (err as ExecFileException).stderr ?? '';
      if (stderr.includes('not found') || stderr.includes('No such container')) {
        return { stopped: false };
      }
      throw err;
    }
  }

  async listFocusContainers(): Promise<Array<{ name: string; cwd: string }>> {
    try {
      const { stdout } = await execFileAsync('container', ['list', '--format', 'json']);
      return parseContainerList(stdout.trim());
    } catch {
      return [];
    }
  }

  async imageExists(tag: string): Promise<boolean> {
    try {
      await execFileAsync('container', ['image', 'inspect', tag]);
      return true;
    } catch {
      return false;
    }
  }

  async buildImage(tag: string, dockerfile: string): Promise<void> {
    // `container build` requires a real context directory; it doesn't support
    // reading a Dockerfile from stdin the way `docker build -` does.
    const contextDir = mkdtempSync(join(tmpdir(), 'focus-build-'));
    try {
      writeFileSync(join(contextDir, 'Dockerfile'), dockerfile);
      await new Promise<void>((resolve, reject) => {
        const child = spawn('container', ['build', '-t', tag, contextDir], {
          stdio: ['ignore', process.stderr, process.stderr],
        });
        child.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`container build failed with exit code ${code ?? 'null'}`));
        });
        child.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'ENOENT') {
            reject(new FocusError('Apple Containers not found. This runtime requires macOS 26 (Tahoe) or later. Set runtime: docker in your config to use a Docker-compatible runtime instead.'));
          } else {
            reject(err);
          }
        });
      });
    } finally {
      rmSync(contextDir, { recursive: true, force: true });
    }
  }
}
