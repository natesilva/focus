import { chown, mkdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { XdgPaths } from './config/xdg.ts';

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

// The entrypoint creates a user named 'focususer'; their home is /home/focususer.
// Caveat: ubuntu:24.04 ships a pre-existing 'ubuntu' user with UID 1000, so a host
// user running as UID 1000 will land in /home/ubuntu, not /home/focususer, and these
// mounts will target the wrong home. Phase 6 (runtime abstraction) is the right place
// to derive the container home dynamically from the resolved user identity.
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
