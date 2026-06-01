import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMounts, configHash, containerName, resolveRunAction } from './container.ts';
import { loadBuiltinProfiles } from './profiles/catalog.ts';
import type { XdgPaths } from './config/xdg.ts';
import type { FocusConfig } from './config/resolver.ts';
import type { InspectResult } from './runtime/adapter.ts';
import type { Profile } from './profiles/types.ts';

const base: FocusConfig = {
  runtime: 'docker',
  tools: ['git', 'node'],
  image: 'ubuntu:24.04',
  network: 'bridge',
};

const gitProfile: Profile = { name: 'git', install: ['apt-get install -y git'], volumes: [], files: {} };
const nodeProfile: Profile = { name: 'node', install: ['apt-get install -y nodejs'], volumes: [], files: {} };
const ripgrepProfile: Profile = { name: 'ripgrep', install: ['apt-get install -y ripgrep'], volumes: [], files: {} };
const baseProfiles = [gitProfile, nodeProfile];

describe('containerName', () => {
  it('same directory yields same name', () => {
    assert.equal(containerName('/home/user/project'), containerName('/home/user/project'));
  });

  it('different directories yield different names', () => {
    assert.notEqual(containerName('/home/user/a'), containerName('/home/user/b'));
  });

  it('name starts with focus-', () => {
    assert.match(containerName('/any/path'), /^focus-[0-9a-f]{8}$/);
  });
});

describe('resolveRunAction', () => {
  const HASH = 'abc123def456789a';
  const OTHER_HASH = 'deadbeef12345678';

  const notRunning: InspectResult = { running: false, labels: {} };
  const runningMatch: InspectResult = { running: true, labels: { 'focus.config-hash': HASH } };
  const runningMismatch: InspectResult = { running: true, labels: { 'focus.config-hash': OTHER_HASH } };

  it('returns launch when container is not running', () => {
    assert.deepEqual(resolveRunAction(notRunning, HASH, true), { type: 'launch' });
    assert.deepEqual(resolveRunAction(notRunning, HASH, false), { type: 'launch' });
  });

  it('returns attach when container is running with matching hash', () => {
    assert.deepEqual(resolveRunAction(runningMatch, HASH, true), { type: 'attach' });
    assert.deepEqual(resolveRunAction(runningMatch, HASH, false), { type: 'attach' });
  });

  it('returns rebuild-interactive when hash differs and interactive is true', () => {
    assert.deepEqual(resolveRunAction(runningMismatch, HASH, true), { type: 'rebuild-interactive' });
  });

  it('returns rebuild-auto when hash differs and interactive is false', () => {
    assert.deepEqual(resolveRunAction(runningMismatch, HASH, false), { type: 'rebuild-auto' });
  });

  it('treats missing config-hash label as mismatch', () => {
    const noLabel: InspectResult = { running: true, labels: {} };
    assert.deepEqual(resolveRunAction(noLabel, HASH, true), { type: 'rebuild-interactive' });
  });
});

describe('configHash', () => {
  it('identical config produces identical hash', () => {
    const a = configHash({ ...base }, baseProfiles);
    const b = configHash({ ...base }, baseProfiles);
    assert.equal(a, b);
  });

  it('profile order does not affect hash', () => {
    const a = configHash({ ...base }, [nodeProfile, gitProfile]);
    const b = configHash({ ...base }, [gitProfile, nodeProfile]);
    assert.equal(a, b);
  });

  it('different profile sets produce different hashes', () => {
    const a = configHash({ ...base }, [gitProfile]);
    const b = configHash({ ...base }, [gitProfile, ripgrepProfile]);
    assert.notEqual(a, b);
  });

  it('different base images produce different hashes', () => {
    const a = configHash({ ...base, image: 'ubuntu:24.04' }, baseProfiles);
    const b = configHash({ ...base, image: 'debian:bookworm-slim' }, baseProfiles);
    assert.notEqual(a, b);
  });

  it('hash is 16 hex characters', () => {
    assert.match(configHash(base, baseProfiles), /^[0-9a-f]{16}$/);
  });

  it('runtime does not affect hash', () => {
    const a = configHash({ ...base, runtime: 'docker' }, baseProfiles);
    const b = configHash({ ...base, runtime: 'apple-containers' }, baseProfiles);
    assert.equal(a, b);
  });

  it('network affects hash', () => {
    const a = configHash({ ...base, network: 'bridge' }, baseProfiles);
    const b = configHash({ ...base, network: 'none' }, baseProfiles);
    assert.notEqual(a, b);
  });

  it('changed profile install steps produce a different hash', () => {
    const gitV2: Profile = { ...gitProfile, install: [...gitProfile.install, 'git config --global core.autocrlf false'] };
    assert.notEqual(configHash({ ...base }, [gitV2]), configHash({ ...base }, [gitProfile]));
  });
});

describe('buildMounts', () => {
  let tmpBase: string;

  before(async () => {
    tmpBase = join(tmpdir(), `focus-buildmounts-test-${Date.now()}`);
    await mkdir(tmpBase, { recursive: true });
  });

  after(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

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

  it('includes volume mounts and file mounts from active profiles', async () => {
    const xdg = makeXdg(join(tmpBase, 'wiring'));
    const uid = process.getuid?.() ?? 1000;
    const builtins = await loadBuiltinProfiles();
    const claudeCodeProfile = builtins.get('claude-code')!;
    const mounts = await buildMounts([claudeCodeProfile], xdg, uid);

    const claudeDir = mounts.find(m => m.containerPath.endsWith('/.claude'));
    assert.ok(claudeDir, 'claude volume mount should be present');

    const claudeJson = mounts.find(m => m.containerPath.endsWith('/.claude.json'));
    assert.ok(claudeJson, 'claude.json file mount should be present via resolveFileMounts');
    assert.equal(claudeJson?.readOnly, false);
  });

  it('profiles with no files add no file mounts beyond volume mounts', async () => {
    const xdg = makeXdg(join(tmpBase, 'no-files'));
    const uid = process.getuid?.() ?? 1000;
    const builtins2 = await loadBuiltinProfiles();
    const gitProfile2 = builtins2.get('git')!;
    const mounts = await buildMounts([gitProfile2], xdg, uid);
    const fileMounts = mounts.filter(m => m.containerPath.endsWith('.json'));
    assert.equal(fileMounts.length, 0);
  });
});
