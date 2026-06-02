import { access } from 'node:fs/promises';
import { rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ensureXdgDirs } from './xdg.ts';

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

describe('ensureXdgDirs', () => {
  let tmpBase: string;
  let savedEnv: Record<string, string | undefined>;

  before(async () => {
    tmpBase = join(tmpdir(), `focus-xdg-test-${Date.now()}`);
    await mkdir(tmpBase, { recursive: true });

    savedEnv = {
      XDG_CONFIG_HOME: process.env['XDG_CONFIG_HOME'],
      XDG_DATA_HOME: process.env['XDG_DATA_HOME'],
      XDG_CACHE_HOME: process.env['XDG_CACHE_HOME'],
      XDG_STATE_HOME: process.env['XDG_STATE_HOME'],
    };

    process.env['XDG_CONFIG_HOME'] = join(tmpBase, 'config');
    process.env['XDG_DATA_HOME'] = join(tmpBase, 'data');
    process.env['XDG_CACHE_HOME'] = join(tmpBase, 'cache');
    process.env['XDG_STATE_HOME'] = join(tmpBase, 'state');
  });

  after(async () => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('creates all five focus directories when they do not exist', async () => {
    await ensureXdgDirs();

    assert.ok(await exists(join(tmpBase, 'config', 'focus')), 'focusConfigDir missing');
    assert.ok(await exists(join(tmpBase, 'config', 'focus', 'profiles')), 'profiles dir missing');
    assert.ok(await exists(join(tmpBase, 'data', 'focus', 'volumes')), 'focusVolumesDir missing');
    assert.ok(await exists(join(tmpBase, 'cache', 'focus')), 'focusCacheDir missing');
    assert.ok(await exists(join(tmpBase, 'state', 'focus')), 'focusStateDir missing');
  });

  it('succeeds without error when directories already exist', async () => {
    await assert.doesNotReject(() => ensureXdgDirs());
  });
});
