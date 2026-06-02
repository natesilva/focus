import { join } from 'node:path';
import { loadProfilesFromDir } from './loader.ts';
import type { Profile } from './types.ts';

export async function loadBuiltinProfiles(): Promise<Map<string, Profile>> {
  const builtinsDir = join(import.meta.dirname, 'builtins');
  return loadProfilesFromDir(builtinsDir);
}
