import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadCustomProfiles } from './custom.ts';
import { getBuiltinProfile, BUILTIN_PROFILES } from './catalog.ts';
import { getProfile } from './index.ts';

describe('built-in profile catalog', () => {
  it('contains all expected profiles', () => {
    const names = BUILTIN_PROFILES.map(p => p.name);
    for (const expected of ['git', 'ripgrep', 'node', 'python', 'rust', 'claude-code', 'ssh']) {
      assert.ok(names.includes(expected), `missing profile: ${expected}`);
    }
  });

  it('ripgrep has a non-empty install list', () => {
    const profile = getBuiltinProfile('ripgrep');
    assert.ok(profile, 'ripgrep profile should exist');
    assert.ok(profile.install.length > 0, 'install list should be non-empty');
  });

  it('ripgrep has no volumes', () => {
    const profile = getBuiltinProfile('ripgrep');
    assert.deepEqual(profile?.volumes, []);
  });

  it('claude-code declares the claude volume', () => {
    const profile = getBuiltinProfile('claude-code');
    assert.ok(profile?.volumes.includes('claude'), 'claude-code should require the claude volume');
  });

  it('ssh declares the ssh volume', () => {
    const profile = getBuiltinProfile('ssh');
    assert.ok(profile?.volumes.includes('ssh'), 'ssh profile should require the ssh volume');
  });
});

describe('loadCustomProfiles', () => {
  let tmpBase: string;

  before(async () => {
    tmpBase = join(tmpdir(), `focus-profiles-test-${Date.now()}`);
    await mkdir(tmpBase, { recursive: true });
  });

  after(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('returns empty map when profiles directory does not exist', async () => {
    const map = await loadCustomProfiles(join(tmpBase, 'no-such-dir'));
    assert.equal(map.size, 0);
  });

  it('loads a valid custom profile', async () => {
    const configDir = join(tmpBase, 'valid');
    await mkdir(join(configDir, 'profiles'), { recursive: true });
    await writeFile(
      join(configDir, 'profiles', 'mytools.yaml'),
      'install:\n  - apt-get install -y jq\n',
    );
    const map = await loadCustomProfiles(configDir);
    const profile = map.get('mytools');
    assert.ok(profile, 'mytools profile should be loaded');
    assert.deepEqual(profile.install, ['apt-get install -y jq']);
    assert.deepEqual(profile.volumes, []);
  });

  it('defaults volumes to empty array when omitted', async () => {
    const configDir = join(tmpBase, 'default-volumes');
    await mkdir(join(configDir, 'profiles'), { recursive: true });
    await writeFile(
      join(configDir, 'profiles', 'novolumes.yaml'),
      'install:\n  - echo hi\n',
    );
    const map = await loadCustomProfiles(configDir);
    assert.deepEqual(map.get('novolumes')?.volumes, []);
  });

  it('loads volumes when specified', async () => {
    const configDir = join(tmpBase, 'with-volumes');
    await mkdir(join(configDir, 'profiles'), { recursive: true });
    await writeFile(
      join(configDir, 'profiles', 'withvol.yaml'),
      'install:\n  - echo hi\nvolumes:\n  - ssh\n',
    );
    const map = await loadCustomProfiles(configDir);
    assert.deepEqual(map.get('withvol')?.volumes, ['ssh']);
  });

  it('throws on invalid profile YAML including the file path', async () => {
    const configDir = join(tmpBase, 'invalid');
    await mkdir(join(configDir, 'profiles'), { recursive: true });
    const filePath = join(configDir, 'profiles', 'bad.yaml');
    await writeFile(filePath, 'install: not-an-array\n');
    await assert.rejects(
      () => loadCustomProfiles(configDir),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes(filePath), 'error should mention the file path');
        return true;
      },
    );
  });

  it('throws on profile with extra unknown keys', async () => {
    const configDir = join(tmpBase, 'strict');
    await mkdir(join(configDir, 'profiles'), { recursive: true });
    await writeFile(
      join(configDir, 'profiles', 'extra.yaml'),
      'install:\n  - echo hi\nunknownField: yes\n',
    );
    await assert.rejects(() => loadCustomProfiles(configDir));
  });
});

describe('getProfile', () => {
  let tmpBase: string;

  before(async () => {
    tmpBase = join(tmpdir(), `focus-getprofile-test-${Date.now()}`);
    await mkdir(tmpBase, { recursive: true });
  });

  after(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('resolves a known built-in profile', async () => {
    const profile = await getProfile('git', tmpBase);
    assert.equal(profile.name, 'git');
    assert.ok(profile.install.length > 0);
  });

  it('throws for an unknown profile name', async () => {
    await assert.rejects(
      () => getProfile('nonexistent-tool', tmpBase),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('nonexistent-tool'));
        return true;
      },
    );
  });

  it('custom profile overrides built-in with same name', async () => {
    const configDir = join(tmpBase, 'override');
    await mkdir(join(configDir, 'profiles'), { recursive: true });
    await writeFile(
      join(configDir, 'profiles', 'git.yaml'),
      'install:\n  - echo custom-git\n',
    );
    const profile = await getProfile('git', configDir);
    assert.deepEqual(profile.install, ['echo custom-git']);
  });
});
