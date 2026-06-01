import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { FocusConfig } from '../config/resolver.ts';
import type { RuntimeAdapter } from './adapter.ts';
import { DockerRuntimeAdapter } from './docker.ts';
import { AppleContainersRuntimeAdapter } from './apple-containers.ts';

const execFileAsync = promisify(execFile);

export async function selectRuntime(runtime: FocusConfig['runtime']): Promise<RuntimeAdapter> {
  if (runtime === 'docker') {
    return new DockerRuntimeAdapter();
  }
  if (runtime === 'apple-containers') {
    return new AppleContainersRuntimeAdapter();
  }
  // 'auto': prefer Apple Containers on macOS if the binary is present
  if (process.platform === 'darwin') {
    try {
      await execFileAsync('container', ['--version']);
      return new AppleContainersRuntimeAdapter();
    } catch {
      // binary not found or failed — fall through to Docker
    }
  }
  return new DockerRuntimeAdapter();
}
