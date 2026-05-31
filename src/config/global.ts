import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { xdgPaths } from './xdg.ts';

const RuntimeSchema = z.enum(['auto', 'docker', 'apple-containers']);

const GlobalConfigSchema = z.object({
  runtime: RuntimeSchema.default('auto'),
  tools: z.array(z.string()).default([]),
  image: z.string().default('ubuntu:24.04'),
});

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;

export async function loadGlobalConfig(): Promise<GlobalConfig> {
  const path = join(xdgPaths().focusConfigDir, 'config.yaml');
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return GlobalConfigSchema.parse({});
    }
    throw err;
  }

  const parsed: unknown = parseYaml(raw);
  return GlobalConfigSchema.parse(parsed ?? {});
}
