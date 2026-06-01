import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import type { Profile } from './types.ts';

const CustomProfileSchema = z.object({
  install: z.array(z.string()),
  volumes: z.array(z.string()).default([]),
  files: z.array(z.string()).default([]),
}).strict();

export async function loadCustomProfiles(configDir: string): Promise<Map<string, Profile>> {
  const profilesDir = join(configDir, 'profiles');
  let entries: string[];
  try {
    entries = await readdir(profilesDir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return new Map();
    }
    throw err;
  }

  const profiles = new Map<string, Profile>();
  for (const entry of entries) {
    if (!entry.endsWith('.yaml')) continue;
    const name = entry.slice(0, -5);
    const filePath = join(profilesDir, entry);
    const raw = await readFile(filePath, 'utf8');
    const parsed: unknown = parseYaml(raw);
    let data: z.infer<typeof CustomProfileSchema>;
    try {
      data = CustomProfileSchema.parse(parsed);
    } catch (err) {
      throw new Error(`Invalid custom profile at ${filePath}: ${String(err)}`);
    }
    profiles.set(name, { name, install: data.install, volumes: data.volumes, files: data.files });
  }
  return profiles;
}
