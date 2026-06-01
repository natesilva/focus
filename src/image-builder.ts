import { createHash } from 'node:crypto';
import type { Profile } from './profiles/index.ts';
import { resolveProfiles } from './profiles/index.ts';
import type { RuntimeAdapter } from './runtime/adapter.ts';

export function computeTag(profileNames: string[], baseImage: string): string {
  const sorted = [...profileNames].sort();
  const input = baseImage + '\n' + sorted.join('\n');
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

export async function buildImage(profileNames: string[], baseImage: string, configDir: string, adapter: RuntimeAdapter): Promise<string> {
  if (profileNames.length === 0) {
    return baseImage;
  }

  const sorted = [...profileNames].sort();
  const tag = computeTag(sorted, baseImage);

  if (await adapter.imageExists(tag)) {
    return tag;
  }

  const profiles = await resolveProfiles(sorted, configDir);
  const dockerfile = generateDockerfile(profiles, baseImage);
  await adapter.buildImage(tag, dockerfile);
  return tag;
}
