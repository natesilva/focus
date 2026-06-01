import { createHash } from 'node:crypto';
import type { Profile } from './profiles/index.ts';
import type { RuntimeAdapter } from './runtime/adapter.ts';
import { FocusError } from './errors.ts';

export function computeTag(profiles: Profile[], baseImage: string): string {
  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
  const input = JSON.stringify({
    baseImage,
    profiles: sorted.map(p => ({ name: p.name, install: p.install })),
  });
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 12);
  return `focus-built:${hash}`;
}

export function generateDockerfile(profiles: Profile[], baseImage: string): string {
  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
  const lines = [`FROM ${baseImage}`];
  for (const profile of sorted) {
    lines.push(`RUN ${profile.install.join(' && ')}`);
  }
  return lines.join('\n') + '\n';
}

export async function buildImage(profiles: Profile[], baseImage: string, adapter: RuntimeAdapter): Promise<string> {
  if (profiles.length === 0) {
    return baseImage;
  }

  const tag = computeTag(profiles, baseImage);

  if (await adapter.imageExists(tag)) {
    return tag;
  }

  const dockerfile = generateDockerfile(profiles, baseImage);
  try {
    await adapter.buildImage(tag, dockerfile);
  } catch (err) {
    if (err instanceof FocusError) throw err;
    const names = profiles.map(p => p.name).join(', ');
    throw new FocusError(`Image build failed for tools [${names}]. Check your network connection or profile definitions.\n  ${err instanceof Error ? err.message : String(err)}`);
  }
  return tag;
}
