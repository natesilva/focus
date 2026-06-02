import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadCustomProfiles } from './custom.ts';
import { loadBuiltinProfiles } from './catalog.ts';
import { loadProfilesFromDir } from './loader.ts';
import { getProfile, resolveProfiles } from './index.ts';

describe('built-in profile catalog', () => {
  it('contains all expected profiles', async () => {
    const map = await loadBuiltinProfiles();
    for (const expected of ['git', 'ripgrep', 'node', 'python', 'rust', 'claude-code', 'ssh']) {
      assert.ok(map.has(expected), `missing profile: ${expected}`);
    }
  });

  it('ripgrep has a non-empty install list', async () => {
    const map = await loadBuiltinProfiles();
    const profile = map.get('ripgrep');
    assert.ok(profile, 'ripgrep profile should exist');
    assert.ok(profile.install.length > 0, 'install list should be non-empty');
  });

  it('ripgrep has no volumes', async () => {
    const map = await loadBuiltinProfiles();
    assert.deepEqual(map.get('ripgrep')?.volumes, []);
  });

  it('claude-code declares the .claude volume', async () => {
    const map = await loadBuiltinProfiles();
    assert.ok(map.get('claude-code')?.volumes.includes('.claude'), 'claude-code should require the .claude volume');
  });

  it('claude-code declares ~/.claude.json with json init', async () => {
    const map = await loadBuiltinProfiles();
    const profile = map.get('claude-code');
    const init = profile?.files['~/.claude.json'];
    assert.ok(init !== undefined, 'claude-code should persist ~/.claude.json');
    assert.ok(init !== null && 'json' in init, 'init should be a json variant');
  });

  it('ssh declares the .ssh volume', async () => {
    const map = await loadBuiltinProfiles();
    assert.ok(map.get('ssh')?.volumes.includes('.ssh'), 'ssh profile should require the .ssh volume');
  });
});

describe('loadProfilesFromDir', () => {
  it('throws when directory does not exist', async () => {
    await assert.rejects(
      () => loadProfilesFromDir('/no/such/dir'),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('/no/such/dir'));
        return true;
      },
    );
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
    assert.deepEqual(profile.files, {});
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

  it('defaults files to empty map when omitted', async () => {
    const configDir = join(tmpBase, 'default-files');
    await mkdir(join(configDir, 'profiles'), { recursive: true });
    await writeFile(
      join(configDir, 'profiles', 'nofiles.yaml'),
      'install:\n  - echo hi\n',
    );
    const map = await loadCustomProfiles(configDir);
    assert.deepEqual(map.get('nofiles')?.files, {});
  });

  it('loads files with null init', async () => {
    const configDir = join(tmpBase, 'with-files-null');
    await mkdir(join(configDir, 'profiles'), { recursive: true });
    await writeFile(
      join(configDir, 'profiles', 'withfiles.yaml'),
      'install:\n  - echo hi\nfiles:\n  ~/.my-tool.json: null\n',
    );
    const map = await loadCustomProfiles(configDir);
    assert.deepEqual(map.get('withfiles')?.files, { '~/.my-tool.json': null });
  });

  it('loads files with json init', async () => {
    const configDir = join(tmpBase, 'with-files-json');
    await mkdir(join(configDir, 'profiles'), { recursive: true });
    await writeFile(
      join(configDir, 'profiles', 'withjson.yaml'),
      'install:\n  - echo hi\nfiles:\n  ~/.config.json:\n    json:\n      theme: dark\n',
    );
    const map = await loadCustomProfiles(configDir);
    const init = map.get('withjson')?.files['~/.config.json'];
    assert.ok(init !== null && init !== undefined && 'json' in init);
    assert.deepEqual(init.json, { theme: 'dark' });
  });

  it('loads files with text init', async () => {
    const configDir = join(tmpBase, 'with-files-text');
    await mkdir(join(configDir, 'profiles'), { recursive: true });
    await writeFile(
      join(configDir, 'profiles', 'withtext.yaml'),
      'install:\n  - echo hi\nfiles:\n  ~/.myrc:\n    text: "# default config"\n',
    );
    const map = await loadCustomProfiles(configDir);
    const init = map.get('withtext')?.files['~/.myrc'];
    assert.ok(init !== null && init !== undefined && 'text' in init);
    assert.equal(init.text, '# default config');
  });

  it('rejects files declared as an array (old format)', async () => {
    const configDir = join(tmpBase, 'array-files');
    await mkdir(join(configDir, 'profiles'), { recursive: true });
    const filePath = join(configDir, 'profiles', 'oldformat.yaml');
    await writeFile(filePath, 'install:\n  - echo hi\nfiles:\n  - ~/.my-tool.json\n');
    await assert.rejects(
      () => loadCustomProfiles(configDir),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes(filePath), 'error should mention the file path');
        return true;
      },
    );
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
    await mkdir(join(tmpBase, 'profiles'), { recursive: true });
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

describe('resolveProfiles', () => {
  let tmpBase: string;

  before(async () => {
    tmpBase = join(tmpdir(), `focus-resolve-test-${Date.now()}`);
    await mkdir(join(tmpBase, 'profiles'), { recursive: true });
  });

  after(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  async function makeConfigDir(name: string, profiles: Record<string, string>): Promise<string> {
    const dir = join(tmpBase, name);
    await mkdir(join(dir, 'profiles'), { recursive: true });
    for (const [profileName, yaml] of Object.entries(profiles)) {
      await writeFile(join(dir, 'profiles', `${profileName}.yaml`), yaml);
    }
    return dir;
  }

  it('direct prerequisite is auto-injected and appears before the dependent', async () => {
    const configDir = await makeConfigDir('direct-prereq', {
      base: 'install:\n  - echo base\n',
      tool: 'prerequisites:\n  - base\ninstall:\n  - echo tool\n',
    });
    const profiles = await resolveProfiles(['tool'], configDir);
    const names = profiles.map(p => p.name);
    assert.ok(names.includes('base'), 'base should be in the resolved set');
    assert.ok(names.indexOf('base') < names.indexOf('tool'), 'base must come before tool');
  });

  it('transitive prerequisites are resolved (A → B → C)', async () => {
    const configDir = await makeConfigDir('transitive', {
      c: 'install:\n  - echo c\n',
      b: 'prerequisites:\n  - c\ninstall:\n  - echo b\n',
      a: 'prerequisites:\n  - b\ninstall:\n  - echo a\n',
    });
    const profiles = await resolveProfiles(['a'], configDir);
    const names = profiles.map(p => p.name);
    assert.deepEqual([...names].sort(), ['a', 'b', 'c'], 'all three should be resolved');
    assert.ok(names.indexOf('c') < names.indexOf('b'), 'c before b');
    assert.ok(names.indexOf('b') < names.indexOf('a'), 'b before a');
  });

  it('shared prerequisite appears only once', async () => {
    const configDir = await makeConfigDir('dedup', {
      shared: 'install:\n  - echo shared\n',
      x: 'prerequisites:\n  - shared\ninstall:\n  - echo x\n',
      y: 'prerequisites:\n  - shared\ninstall:\n  - echo y\n',
    });
    const profiles = await resolveProfiles(['x', 'y'], configDir);
    const names = profiles.map(p => p.name);
    assert.equal(names.filter(n => n === 'shared').length, 1, 'shared appears exactly once');
  });

  it('explicitly listed prerequisite is not duplicated', async () => {
    const profiles = await resolveProfiles(['claude-code', 'node'], tmpBase);
    const names = profiles.map(p => p.name);
    assert.equal(names.filter(n => n === 'node').length, 1, 'node appears exactly once');
  });

  it('throws for a missing prerequisite, naming both profiles', async () => {
    const configDir = await makeConfigDir('missing-prereq', {
      broken: 'prerequisites:\n  - nonexistent\ninstall:\n  - echo broken\n',
    });
    await assert.rejects(
      () => resolveProfiles(['broken'], configDir),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('broken'), 'error should mention declaring profile');
        assert.ok(err.message.includes('nonexistent'), 'error should mention missing prerequisite');
        return true;
      },
    );
  });

  it('throws for a direct circular prerequisite chain, showing the path', async () => {
    const configDir = await makeConfigDir('cycle-direct', {
      alpha: 'prerequisites:\n  - beta\ninstall:\n  - echo alpha\n',
      beta: 'prerequisites:\n  - alpha\ninstall:\n  - echo beta\n',
    });
    await assert.rejects(
      () => resolveProfiles(['alpha'], configDir),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.toLowerCase().includes('circular'), 'error should mention circular dependency');
        assert.ok(err.message.includes('→'), 'error should show the directed path');
        return true;
      },
    );
  });

  it('throws for an indirect circular prerequisite chain (A → B → C → A)', async () => {
    const configDir = await makeConfigDir('cycle-indirect', {
      p: 'prerequisites:\n  - q\ninstall:\n  - echo p\n',
      q: 'prerequisites:\n  - r\ninstall:\n  - echo q\n',
      r: 'prerequisites:\n  - p\ninstall:\n  - echo r\n',
    });
    await assert.rejects(
      () => resolveProfiles(['p'], configDir),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.toLowerCase().includes('circular'), 'error should mention circular dependency');
        assert.ok(err.message.includes('→'), 'error should show the directed path');
        return true;
      },
    );
  });

  it('independent profiles are returned in alphabetical order', async () => {
    const profiles = await resolveProfiles(['ripgrep', 'git'], tmpBase);
    const names = profiles.map(p => p.name);
    assert.ok(names.indexOf('git') < names.indexOf('ripgrep'), 'git before ripgrep (alphabetical)');
  });

  it('input order does not affect the resolved order', async () => {
    const [a, b] = await Promise.all([
      resolveProfiles(['claude-code', 'git'], tmpBase),
      resolveProfiles(['git', 'claude-code'], tmpBase),
    ]);
    assert.deepEqual(a.map(p => p.name), b.map(p => p.name), 'order should be identical regardless of input order');
  });

  it('prints an informational note to stderr for auto-injected prerequisites', async () => {
    const configDir = await makeConfigDir('stderr-note', {
      base: 'install:\n  - echo base\n',
      tool: 'prerequisites:\n  - base\ninstall:\n  - echo tool\n',
    });
    const lines: string[] = [];
    const origWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string | Uint8Array) => {
      if (typeof chunk === 'string') lines.push(chunk);
      return true;
    }) as typeof process.stderr.write;
    try {
      await resolveProfiles(['tool'], configDir);
    } finally {
      process.stderr.write = origWrite;
    }
    assert.ok(lines.some(l => l.includes('note: adding "base" (required by tool)')));
  });

  it('does not print an informational note when prerequisite is explicitly listed', async () => {
    const lines: string[] = [];
    const origWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string | Uint8Array) => {
      if (typeof chunk === 'string') lines.push(chunk);
      return true;
    }) as typeof process.stderr.write;
    try {
      await resolveProfiles(['claude-code', 'node'], tmpBase);
    } finally {
      process.stderr.write = origWrite;
    }
    assert.ok(!lines.some(l => l.includes('"node"')), 'no note should be printed for explicitly listed node');
  });

  it('prints the informational note exactly once when multiple profiles share a prerequisite', async () => {
    const configDir = await makeConfigDir('stderr-dedup', {
      shared: 'install:\n  - echo shared\n',
      x: 'prerequisites:\n  - shared\ninstall:\n  - echo x\n',
      y: 'prerequisites:\n  - shared\ninstall:\n  - echo y\n',
    });
    const lines: string[] = [];
    const origWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string | Uint8Array) => {
      if (typeof chunk === 'string') lines.push(chunk);
      return true;
    }) as typeof process.stderr.write;
    try {
      await resolveProfiles(['x', 'y'], configDir);
    } finally {
      process.stderr.write = origWrite;
    }
    assert.equal(lines.filter(l => l.includes('"shared"')).length, 1, 'note for shared should appear exactly once');
  });

  it('claude-code built-in declares node as a prerequisite and has no Node.js install steps', async () => {
    const profile = await getProfile('claude-code', tmpBase);
    assert.ok(profile.prerequisites.includes('node'), 'claude-code should declare node as prerequisite');
    const installScript = profile.install.join('\n');
    assert.ok(!installScript.includes('nodejs'), 'claude-code install should not install nodejs');
    assert.ok(!installScript.includes('nodesource'), 'claude-code install should not reference nodesource');
  });

  it('resolveProfiles(["claude-code"]) auto-injects node before claude-code', async () => {
    const profiles = await resolveProfiles(['claude-code'], tmpBase);
    const names = profiles.map(p => p.name);
    assert.ok(names.includes('node'), 'node should be auto-injected');
    assert.ok(names.indexOf('node') < names.indexOf('claude-code'), 'node must appear before claude-code');
  });
});
