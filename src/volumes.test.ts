import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

// We test resolveVolumeMounts by passing a custom XdgPaths with a temp dir.
// The function under test creates real directories; we clean up afterward.

import { resolveVolumeMounts } from './volumes.ts';
import type { XdgPaths } from './config/xdg.ts';

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

describe('resolveVolumeMounts', () => {
  let tmpBase: string;

  before(async () => {
    tmpBase = join(tmpdir(), `focus-test-${Date.now()}`);
    await mkdir(tmpBase, { recursive: true });
  });

  after(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('creates the claude volume directory on first use', async () => {
    const xdg = makeXdg(join(tmpBase, 'first-use'));
    const mounts = await resolveVolumeMounts(xdg, process.getuid?.() ?? 1000);

    const claudeMount = mounts.find(m => m.containerPath.endsWith('/.claude'));
    assert.ok(claudeMount, 'claude mount descriptor should be present');

    const s = await stat(claudeMount.hostPath);
    assert.ok(s.isDirectory(), 'claude host path should be a directory');
  });

  it('is idempotent — second call does not throw', async () => {
    const xdg = makeXdg(join(tmpBase, 'idempotent'));
    await resolveVolumeMounts(xdg, process.getuid?.() ?? 1000);
    await assert.doesNotReject(() => resolveVolumeMounts(xdg, process.getuid?.() ?? 1000));
  });

  it('creates the ssh directory with mode 0700', async () => {
    const xdg = makeXdg(join(tmpBase, 'ssh-mode'));
    const mounts = await resolveVolumeMounts(xdg, process.getuid?.() ?? 1000);

    const sshMount = mounts.find(m => m.containerPath.endsWith('/.ssh'));
    assert.ok(sshMount, 'ssh mount descriptor should be present');

    const s = await stat(sshMount.hostPath);
    // stat mode includes file type bits; mask to permission bits only
    assert.equal(s.mode & 0o777, 0o700, 'ssh directory should have mode 0700');
  });

  it('omits the git slot when the gitconfig path does not exist', async () => {
    const xdg = makeXdg(join(tmpBase, 'no-gitconfig'));
    const mounts = await resolveVolumeMounts(xdg, process.getuid?.() ?? 1000, '/nonexistent/.gitconfig');
    const gitMount = mounts.find(m => m.containerPath === '/etc/gitconfig');
    assert.equal(gitMount, undefined, 'git mount should be absent when the file does not exist');
  });

  it('includes the git slot when the gitconfig path exists', async () => {
    const xdg = makeXdg(join(tmpBase, 'with-gitconfig'));
    const fakeGitconfig = join(tmpBase, 'fake.gitconfig');
    await writeFile(fakeGitconfig, '[user]\n\tname = Test\n');
    const mounts = await resolveVolumeMounts(xdg, process.getuid?.() ?? 1000, fakeGitconfig);
    const gitMount = mounts.find(m => m.containerPath === '/etc/gitconfig');
    assert.ok(gitMount, 'git mount should be present when the file exists');
    assert.equal(gitMount?.readOnly, true, 'git mount should be read-only');
    assert.equal(gitMount?.hostPath, fakeGitconfig);
  });

  it('returns correct MountDescriptor shapes', async () => {
    const xdg = makeXdg(join(tmpBase, 'shapes'));
    const mounts = await resolveVolumeMounts(xdg, process.getuid?.() ?? 1000);

    for (const m of mounts) {
      assert.equal(typeof m.hostPath, 'string', 'hostPath should be a string');
      assert.equal(typeof m.containerPath, 'string', 'containerPath should be a string');
      assert.equal(typeof m.readOnly, 'boolean', 'readOnly should be a boolean');
    }

    const claudeMount = mounts.find(m => m.containerPath.endsWith('/.claude'));
    assert.equal(claudeMount?.readOnly, false, 'claude mount should not be read-only');

    const sshMount = mounts.find(m => m.containerPath.endsWith('/.ssh'));
    assert.equal(sshMount?.readOnly, false, 'ssh mount should not be read-only');
  });
});
