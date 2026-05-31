import type { Profile } from './types.ts';
import { getBuiltinProfile } from './catalog.ts';
import { loadCustomProfiles } from './custom.ts';

export type { Profile };

function lookupProfile(name: string, customMap: Map<string, Profile>): Profile {
  const profile = customMap.get(name) ?? getBuiltinProfile(name);
  if (profile === undefined) {
    throw new Error(`Unknown tool profile: "${name}". Check your .focus.yaml tools list.`);
  }
  return profile;
}

export async function getProfile(name: string, configDir: string): Promise<Profile> {
  return lookupProfile(name, await loadCustomProfiles(configDir));
}

export async function resolveProfiles(names: string[], configDir: string): Promise<Profile[]> {
  const customMap = await loadCustomProfiles(configDir);
  return names.map(name => lookupProfile(name, customMap));
}
