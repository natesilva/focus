import { loadGlobalConfig } from './global.ts';
import { loadProjectConfig } from './project.ts';

export interface FocusConfig {
  runtime: 'auto' | 'docker' | 'apple-containers';
  tools: string[];
  image: string;
  network: 'bridge' | 'none';
}

export interface ConfigFlags {
  runtime?: FocusConfig['runtime'];
  tools?: string[];
  image?: string;
  network?: FocusConfig['network'];
}

export async function resolveConfig(projectDir: string, flags?: ConfigFlags): Promise<FocusConfig> {
  const global = await loadGlobalConfig();
  const project = await loadProjectConfig(projectDir);

  return {
    runtime: flags?.runtime ?? project?.runtime ?? global.runtime,
    tools: flags?.tools ?? project?.tools ?? global.tools,
    image: flags?.image ?? project?.image ?? global.image,
    network: flags?.network ?? project?.network ?? 'bridge',
  };
}
