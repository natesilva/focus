import type { Profile } from './types.ts';
import { loadBuiltinProfiles } from './catalog.ts';
import { loadCustomProfiles } from './custom.ts';

export type { Profile };

async function resolveAll(configDir: string): Promise<Map<string, Profile>> {
  const [builtins, custom] = await Promise.all([
    loadBuiltinProfiles(),
    loadCustomProfiles(configDir),
  ]);
  const merged = new Map(builtins);
  for (const [name, profile] of custom) {
    merged.set(name, profile);
  }
  return merged;
}

function lookupProfile(name: string, map: Map<string, Profile>): Profile {
  const profile = map.get(name);
  if (profile === undefined) {
    throw new Error(`Unknown tool profile: "${name}". Check your .focus.yaml tools list.`);
  }
  return profile;
}

export async function getProfile(name: string, configDir: string): Promise<Profile> {
  return lookupProfile(name, await resolveAll(configDir));
}

export async function resolveProfiles(names: string[], configDir: string): Promise<Profile[]> {
  const map = await resolveAll(configDir);
  return names.map(name => lookupProfile(name, map));
}
