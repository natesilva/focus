import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { resolveFileMounts, resolveProfileVolumes } from './volumes.ts';
import type { XdgPaths } from './config/xdg.ts';
import type { FileInit, Profile } from './profiles/types.ts';

function makeXdg(base: string): XdgPaths {
  const dataHome = join(base, 'data');
  return {
    configHome: join(base, 'config'),
    dataHome,
    cacheHome: join(base, 'cache'),
    stateHome: join(base, 'state'),
    focusConfigDir: join(base, 'config', 'focus'),
    focusVolumesDir: join(dataHome, 'focus', 'volumes'),
    focusCacheDir: join(base, 'cache', 'focus'),
    focusStateDir: join(base, 'state', 'focus'),
  };
}

function makeProfile(name: string, volumes: string[], files: Record<string, FileInit | null> = {}): Profile {
  return { name, install: [], volumes, files };
}

describe('resolveProfileVolumes', () => {
  let tmpBase: string;

  before(async () => {
    tmpBase = join(tmpdir(), `focus-vols-test-${Date.now()}`);
    await mkdir(tmpBase, { recursive: true });
  });

  after(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('returns empty array when no profiles declare volumes', async () => {
    const xdg = makeXdg(join(tmpBase, 'empty'));
    const mounts = await resolveProfileVolumes([makeProfile('tool', [])], xdg, process.getuid?.() ?? 1000);
    assert.deepEqual(mounts, []);
  });

  it('returns empty array for empty profiles list', async () => {
    const xdg = makeXdg(join(tmpBase, 'no-profiles'));
    const mounts = await resolveProfileVolumes([], xdg, process.getuid?.() ?? 1000);
    assert.deepEqual(mounts, []);
  });

  it('mounts a single declared volume', async () => {
    const xdg = makeXdg(join(tmpBase, 'single'));
    const mounts = await resolveProfileVolumes([makeProfile('claude-code', ['.claude'])], xdg, process.getuid?.() ?? 1000);
    assert.equal(mounts.length, 1);
    assert.equal(mounts[0].containerPath, '/home/focususer/.claude');
    assert.ok(mounts[0].hostPath.endsWith('/claude-code/.claude'));
    assert.equal(mounts[0].readOnly, false);
  });

  it('mounts volumes from multiple profiles', async () => {
    const xdg = makeXdg(join(tmpBase, 'multi'));
    const mounts = await resolveProfileVolumes([
      makeProfile('claude-code', ['.claude']),
      makeProfile('ssh', ['.ssh']),
    ], xdg, process.getuid?.() ?? 1000);
    assert.equal(mounts.length, 2);
    const paths = mounts.map(m => m.containerPath);
    assert.ok(paths.includes('/home/focususer/.claude'));
    assert.ok(paths.includes('/home/focususer/.ssh'));
  });

  it('deduplicates volumes declared by multiple profiles', async () => {
    const xdg = makeXdg(join(tmpBase, 'dedup'));
    const mounts = await resolveProfileVolumes([
      makeProfile('a', ['.claude']),
      makeProfile('b', ['.claude']),
    ], xdg, process.getuid?.() ?? 1000);
    assert.equal(mounts.length, 1);
  });

  it('creates the host directory on first use', async () => {
    const xdg = makeXdg(join(tmpBase, 'creates'));
    const mounts = await resolveProfileVolumes([makeProfile('claude-code', ['.claude'])], xdg, process.getuid?.() ?? 1000);
    const s = await stat(mounts[0].hostPath);
    assert.ok(s.isDirectory());
  });

  it('is idempotent — second call does not throw', async () => {
    const xdg = makeXdg(join(tmpBase, 'idempotent'));
    await resolveProfileVolumes([makeProfile('claude-code', ['.claude'])], xdg, process.getuid?.() ?? 1000);
    await assert.doesNotReject(() => resolveProfileVolumes([makeProfile('claude-code', ['.claude'])], xdg, process.getuid?.() ?? 1000));
  });

  it('chowns newly created directory to host UID', async () => {
    const xdg = makeXdg(join(tmpBase, 'chown'));
    const uid = process.getuid?.() ?? 1000;
    const mounts = await resolveProfileVolumes([makeProfile('claude-code', ['.claude'])], xdg, uid);
    const s = await stat(mounts[0].hostPath);
    assert.equal(s.uid, uid);
  });

  it('creates .ssh directory with mode 0700', async () => {
    const xdg = makeXdg(join(tmpBase, 'ssh-mode'));
    const mounts = await resolveProfileVolumes([makeProfile('ssh', ['.ssh'])], xdg, process.getuid?.() ?? 1000);
    const s = await stat(mounts[0].hostPath);
    assert.equal(s.mode & 0o777, 0o700);
  });

  it('namespaces host path by profile name, uses name verbatim for container path', async () => {
    const xdg = makeXdg(join(tmpBase, 'namespaced'));
    const mounts = await resolveProfileVolumes([makeProfile('tool', ['mydir'])], xdg, process.getuid?.() ?? 1000);
    assert.ok(mounts[0].hostPath.endsWith('/tool/mydir'));
    assert.equal(mounts[0].containerPath, '/home/focususer/mydir');
  });
});

describe('resolveFileMounts', () => {
  let tmpBase: string;

  before(async () => {
    tmpBase = join(tmpdir(), `focus-filemounts-test-${Date.now()}`);
    await mkdir(tmpBase, { recursive: true });
  });

  after(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('returns empty array for profiles with no files', async () => {
    const xdg = makeXdg(join(tmpBase, 'no-files'));
    const mounts = await resolveFileMounts([makeProfile('my-tool', [])], xdg, process.getuid?.() ?? 1000);
    assert.deepEqual(mounts, []);
  });

  it('creates host file when missing (null init)', async () => {
    const xdg = makeXdg(join(tmpBase, 'creates-file'));
    const mounts = await resolveFileMounts([makeProfile('my-tool', [], { '~/.my-tool.json': null })], xdg, process.getuid?.() ?? 1000);
    assert.equal(mounts.length, 1);
    const s = await stat(mounts[0].hostPath);
    assert.ok(s.isFile(), 'host path should be a file');
  });

  it('creates host file with empty content when init is null', async () => {
    const xdg = makeXdg(join(tmpBase, 'empty-content'));
    const mounts = await resolveFileMounts([makeProfile('my-tool', [], { '~/.my-tool.json': null })], xdg, process.getuid?.() ?? 1000);
    const content = await readFile(mounts[0].hostPath, 'utf8');
    assert.equal(content, '');
  });

  it('creates host file with JSON content when init is { json }', async () => {
    const xdg = makeXdg(join(tmpBase, 'json-content'));
    const mounts = await resolveFileMounts(
      [makeProfile('my-tool', [], { '~/.config.json': { json: { theme: 'dark' } } })],
      xdg, process.getuid?.() ?? 1000,
    );
    const content = await readFile(mounts[0].hostPath, 'utf8');
    assert.deepEqual(JSON.parse(content), { theme: 'dark' });
  });

  it('creates host file with text content when init is { text }', async () => {
    const xdg = makeXdg(join(tmpBase, 'text-content'));
    const mounts = await resolveFileMounts(
      [makeProfile('my-tool', [], { '~/.myrc': { text: '# default config' } })],
      xdg, process.getuid?.() ?? 1000,
    );
    const content = await readFile(mounts[0].hostPath, 'utf8');
    assert.equal(content, '# default config');
  });

  it('creates host file with {} when init is { json: {} }', async () => {
    const xdg = makeXdg(join(tmpBase, 'empty-json'));
    const mounts = await resolveFileMounts(
      [makeProfile('claude-code', [], { '~/.claude.json': { json: {} } })],
      xdg, process.getuid?.() ?? 1000,
    );
    const content = await readFile(mounts[0].hostPath, 'utf8');
    assert.deepEqual(JSON.parse(content), {});
  });

  it('chowns created file to host UID', async () => {
    const xdg = makeXdg(join(tmpBase, 'chown'));
    const uid = process.getuid?.() ?? 1000;
    const mounts = await resolveFileMounts([makeProfile('my-tool', [], { '~/.my-tool.json': null })], xdg, uid);
    const s = await stat(mounts[0].hostPath);
    assert.equal(s.uid, uid);
  });

  it('uses existing file as-is without re-seeding', async () => {
    const xdg = makeXdg(join(tmpBase, 'existing'));
    const hostDir = join(xdg.focusVolumesDir, 'my-tool');
    await mkdir(hostDir, { recursive: true });
    const existingPath = join(hostDir, '.my-tool.json');
    await writeFile(existingPath, '{"existing":true}');
    const mounts = await resolveFileMounts(
      [makeProfile('my-tool', [], { '~/.my-tool.json': { json: {} } })],
      xdg, process.getuid?.() ?? 1000,
    );
    assert.equal(mounts.length, 1);
    const content = await readFile(mounts[0].hostPath, 'utf8');
    assert.equal(content, '{"existing":true}');
  });

  it('derives host path namespaced by profile name', async () => {
    const xdg = makeXdg(join(tmpBase, 'namespaced'));
    const mounts = await resolveFileMounts([makeProfile('my-tool', [], { '~/.my-tool.json': null })], xdg, process.getuid?.() ?? 1000);
    assert.ok(mounts[0].hostPath.includes('my-tool'), 'host path should include profile name');
    assert.ok(mounts[0].hostPath.endsWith('.my-tool.json'), 'host path should end with filename');
  });

  it('expands ~/ to container home in container path', async () => {
    const xdg = makeXdg(join(tmpBase, 'tilde'));
    const mounts = await resolveFileMounts([makeProfile('my-tool', [], { '~/.my-tool.json': null })], xdg, process.getuid?.() ?? 1000);
    assert.equal(mounts[0].containerPath, '/home/focususer/.my-tool.json');
  });

  it('mounts as read-write', async () => {
    const xdg = makeXdg(join(tmpBase, 'readwrite'));
    const mounts = await resolveFileMounts([makeProfile('my-tool', [], { '~/.my-tool.json': null })], xdg, process.getuid?.() ?? 1000);
    assert.equal(mounts[0].readOnly, false);
  });

  it('throws on absolute paths', async () => {
    const xdg = makeXdg(join(tmpBase, 'absolute'));
    await assert.rejects(
      () => resolveFileMounts([makeProfile('my-tool', [], { '/etc/my-tool.conf': null })], xdg, process.getuid?.() ?? 1000),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('/etc/my-tool.conf'));
        return true;
      },
    );
  });

  it('collects file mounts from multiple profiles', async () => {
    const xdg = makeXdg(join(tmpBase, 'multi'));
    const mounts = await resolveFileMounts([
      makeProfile('tool-a', [], { '~/.tool-a.json': null }),
      makeProfile('tool-b', [], { '~/.tool-b.json': null }),
    ], xdg, process.getuid?.() ?? 1000);
    assert.equal(mounts.length, 2);
  });
});
