import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface XdgPaths {
  configHome: string;
  dataHome: string;
  cacheHome: string;
  stateHome: string;
  focusConfigDir: string;
  focusVolumesDir: string;
  focusCacheDir: string;
  focusStateDir: string;
}

export function xdgPaths(): XdgPaths {
  const home = homedir();
  const configHome = process.env['XDG_CONFIG_HOME'] || join(home, '.config');
  const dataHome = process.env['XDG_DATA_HOME'] || join(home, '.local', 'share');
  const cacheHome = process.env['XDG_CACHE_HOME'] || join(home, '.cache');
  const stateHome = process.env['XDG_STATE_HOME'] || join(home, '.local', 'state');

  return {
    configHome,
    dataHome,
    cacheHome,
    stateHome,
    focusConfigDir: join(configHome, 'focus'),
    focusVolumesDir: join(dataHome, 'focus', 'volumes'),
    focusCacheDir: join(cacheHome, 'focus'),
    focusStateDir: join(stateHome, 'focus'),
  };
}

export async function ensureXdgDirs(): Promise<void> {
  const paths = xdgPaths();
  await Promise.all([
    mkdir(paths.focusConfigDir, { recursive: true }),
    mkdir(join(paths.focusConfigDir, 'profiles'), { recursive: true }),
    mkdir(paths.focusVolumesDir, { recursive: true }),
    mkdir(paths.focusCacheDir, { recursive: true }),
    mkdir(paths.focusStateDir, { recursive: true }),
  ]);
}
