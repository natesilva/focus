import { chown, mkdir, stat, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { XdgPaths } from './config/xdg.ts';
import type { FileInit, Profile } from './profiles/types.ts';

export interface MountDescriptor {
  hostPath: string;
  containerPath: string;
  readOnly: boolean;
}

// Volumes are always mounted under /home/focususer. When the host user's UID maps to
// a different user in the base image (e.g. ubuntu:24.04 ships 'ubuntu' at UID 1000),
// the entrypoint creates symlinks from the actual home into this directory so the
// running user can still find the volumes at the expected paths.
const CONTAINER_HOME = '/home/focususer';

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function resolveProfileVolumes(
  profiles: Profile[],
  xdg: XdgPaths,
  hostUid: number,
): Promise<MountDescriptor[]> {
  const seen = new Set<string>();
  const mounts: MountDescriptor[] = [];

  for (const profile of profiles) {
    for (const name of profile.volumes) {
      if (seen.has(name)) continue;
      seen.add(name);

      const hostPath = join(xdg.focusVolumesDir, profile.name, name);
      if (!await pathExists(hostPath)) {
        // SSH refuses to use keys in a directory with loose permissions.
        const mode = name === '.ssh' ? 0o700 : 0o755;
        await mkdir(hostPath, { recursive: true, mode });
        await chown(hostPath, hostUid, -1);
      }

      mounts.push({ hostPath, containerPath: `${CONTAINER_HOME}/${name}`, readOnly: false });
    }
  }

  return mounts;
}

function serializeInit(init: FileInit | null): string {
  if (init === null) return '';
  if ('json' in init) return JSON.stringify(init.json, null, 2);
  return init.text;
}

export async function resolveFileMounts(
  profiles: Profile[],
  xdg: XdgPaths,
  hostUid: number,
): Promise<MountDescriptor[]> {
  const mounts: MountDescriptor[] = [];

  for (const profile of profiles) {
    for (const [filePath, init] of Object.entries(profile.files)) {
      if (!filePath.startsWith('~/')) {
        throw new Error(
          `Profile "${profile.name}" declares an invalid file path "${filePath}": paths must start with ~/`,
        );
      }

      const containerPath = CONTAINER_HOME + filePath.slice(1);
      const hostDir = join(xdg.focusVolumesDir, profile.name);
      const hostPath = join(hostDir, basename(filePath));

      const hostDirExists = await pathExists(hostDir);
      await mkdir(hostDir, { recursive: true });
      if (!hostDirExists) {
        await chown(hostDir, hostUid, -1);
      }

      if (!await pathExists(hostPath)) {
        await writeFile(hostPath, serializeInit(init));
        await chown(hostPath, hostUid, -1);
      }

      mounts.push({ hostPath, containerPath, readOnly: false });
    }
  }

  return mounts;
}
