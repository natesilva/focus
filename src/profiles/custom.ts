import { join } from 'node:path';
import { loadProfilesFromDir } from './loader.ts';
import type { Profile } from './types.ts';

export async function loadCustomProfiles(configDir: string): Promise<Map<string, Profile>> {
  const profilesDir = join(configDir, 'profiles');
  return loadProfilesFromDir(profilesDir);
}
