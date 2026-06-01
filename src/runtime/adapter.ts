import type { MountDescriptor } from '../volumes.ts';

export interface StartOptions {
  name: string;
  image: string;
  cwd: string;
  uid: number;
  configHash: string;
  entrypointScript: string;
  command?: string[];
  network?: 'none';
  mounts?: MountDescriptor[];
  env?: Record<string, string>;
}

export interface InspectResult {
  running: boolean;
  labels: Record<string, string>;
}

export interface RuntimeAdapter {
  start(opts: StartOptions): Promise<number>;
  exec(name: string, uid: number, command: string[] | undefined, tty: boolean, env?: Record<string, string>): Promise<number>;
  inspect(name: string): Promise<InspectResult>;
  stop(name: string): Promise<{ stopped: boolean }>;
  listFocusContainers(): Promise<Array<{ name: string; cwd: string }>>;
  imageExists(tag: string): Promise<boolean>;
  buildImage(tag: string, dockerfile: string): Promise<void>;
}
