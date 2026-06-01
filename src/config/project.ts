import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { FocusError } from '../errors.ts';

const ProjectConfigSchema = z.object({
  runtime: z.enum(['auto', 'docker', 'apple-containers']).optional(),
  tools: z.array(z.string()).optional(),
  image: z.string().optional(),
  network: z.enum(['bridge', 'none']).optional(),
}).strict();

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export async function loadProjectConfig(dir: string): Promise<ProjectConfig | null> {
  const path = join(dir, '.focus.yaml');
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }

  const parsed: unknown = parseYaml(raw);
  try {
    return ProjectConfigSchema.parse(parsed ?? {});
  } catch (err) {
    throw new FocusError(`Invalid project config at ${path}: ${err instanceof z.ZodError ? err.message : String(err)}`);
  }
}
