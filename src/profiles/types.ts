export type FileInit = { json: unknown } | { text: string };

export interface Profile {
  name: string;
  prerequisites: string[];
  install: string[];
  volumes: string[];
  files: Record<string, FileInit | null>;
}
