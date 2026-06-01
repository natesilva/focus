import { chown, mkdir, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import type { XdgPaths } from './config/xdg.ts';
import type { FileInit, Profile } from './profiles/types.ts';

export interface MountDescriptor {
  hostPath: string;
  containerPath: string;
  readOnly: boolean;
}

interface DirectorySlot {
  name: string;
  hostPath: (xdg: XdgPaths) => string;
  containerPath: string;
  readOnly: boolean;
  kind: 'directory';
  /** Unix mode applied to newly-created directories. */
  mode?: number;
}

interface FileSlot {
  name: string;
  containerPath: string;
  readOnly: boolean;
  kind: 'file';
}

type VolumeSlot = DirectorySlot | FileSlot;

// Volumes are always mounted under /home/focususer. When the host user's UID maps to
// a different user in the base image (e.g. ubuntu:24.04 ships 'ubuntu' at UID 1000),
// the entrypoint creates symlinks from the actual home into this directory so the
// running user can still find the volumes at the expected paths.
const CONTAINER_HOME = '/home/focususer';

const SLOTS: VolumeSlot[] = [
  {
    name: 'claude',
    hostPath: (xdg) => join(xdg.focusVolumesDir, 'claude'),
    containerPath: `${CONTAINER_HOME}/.claude`,
    readOnly: false,
    kind: 'directory',
  },
  {
    name: 'ssh',
    hostPath: (xdg) => join(xdg.focusVolumesDir, 'ssh'),
    containerPath: `${CONTAINER_HOME}/.ssh`,
    readOnly: false,
    kind: 'directory',
    mode: 0o700,
  },
  {
    name: 'git',
    containerPath: '/etc/gitconfig',
    readOnly: true,
    kind: 'file',
  },
];

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function resolveVolumeMounts(
  xdg: XdgPaths,
  hostUid: number,
  gitConfigPath = join(homedir(), '.gitconfig'),
): Promise<MountDescriptor[]> {
  const mounts: MountDescriptor[] = [];

  for (const slot of SLOTS) {
    if (slot.kind === 'file') {
      if (await pathExists(gitConfigPath)) {
        mounts.push({ hostPath: gitConfigPath, containerPath: slot.containerPath, readOnly: slot.readOnly });
      }
      continue;
    }

    const hostPath = slot.hostPath(xdg);
    const exists = await pathExists(hostPath);
    if (!exists) {
      const mode = slot.mode ?? 0o755;
      await mkdir(hostPath, { recursive: true, mode });
      await chown(hostPath, hostUid, -1);
    }

    mounts.push({ hostPath, containerPath: slot.containerPath, readOnly: slot.readOnly });
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
