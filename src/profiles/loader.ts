import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import type { Profile } from './types.ts';

const FileInitSchema = z.union([
  z.null(),
  z.object({ json: z.unknown() }),
  z.object({ text: z.string() }),
]);

const ProfileSchema = z.object({
  install: z.array(z.string()),
  volumes: z.array(z.string()).default([]),
  files: z.record(z.string(), FileInitSchema).default({}),
}).strict();

export async function loadProfilesFromDir(
  dir: string,
  opts: { required: boolean },
): Promise<Map<string, Profile>> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      if (opts.required) {
        throw new Error(`Built-in profiles directory not found: ${dir}`);
      }
      return new Map();
    }
    throw err;
  }

  const profiles = new Map<string, Profile>();
  for (const entry of entries) {
    if (!entry.endsWith('.yaml')) continue;
    const name = entry.slice(0, -5);
    const filePath = join(dir, entry);
    const raw = await readFile(filePath, 'utf8');
    const parsed: unknown = parseYaml(raw);
    let data: z.infer<typeof ProfileSchema>;
    try {
      data = ProfileSchema.parse(parsed);
    } catch (err) {
      throw new Error(`Invalid profile at ${filePath}: ${String(err)}`);
    }
    profiles.set(name, { name, install: data.install, volumes: data.volumes, files: data.files });
  }
  return profiles;
}
