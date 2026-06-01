import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadProjectConfig } from './project.ts';

describe('project config schema — shell.prompt', () => {
  let tmpDir: string;

  before(async () => {
    tmpDir = join(tmpdir(), `focus-config-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  async function write(content: string): Promise<string> {
    const dir = join(tmpDir, String(Math.random()));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, '.focus.yaml'), content);
    return dir;
  }

  it('shell absent → shell is undefined', async () => {
    const dir = await write('tools: [git]');
    const config = await loadProjectConfig(dir);
    assert.equal(config?.shell, undefined);
  });

  it('shell.prompt: false', async () => {
    const dir = await write('shell:\n  prompt: false');
    const config = await loadProjectConfig(dir);
    assert.equal(config?.shell?.prompt, false);
  });

  it('shell.prompt: true', async () => {
    const dir = await write('shell:\n  prompt: true');
    const config = await loadProjectConfig(dir);
    assert.equal(config?.shell?.prompt, true);
  });

  it('shell.prompt.style inline', async () => {
    const dir = await write('shell:\n  prompt:\n    style: inline');
    const config = await loadProjectConfig(dir);
    assert.deepEqual(config?.shell?.prompt, { style: 'inline' });
  });

  it('shell.prompt.style two-line', async () => {
    const dir = await write('shell:\n  prompt:\n    style: two-line');
    const config = await loadProjectConfig(dir);
    assert.deepEqual(config?.shell?.prompt, { style: 'two-line' });
  });

  it('unknown style value rejected', async () => {
    const dir = await write('shell:\n  prompt:\n    style: fancy');
    await assert.rejects(() => loadProjectConfig(dir));
  });

  it('unknown key inside shell rejected', async () => {
    const dir = await write('shell:\n  unknown: true');
    await assert.rejects(() => loadProjectConfig(dir));
  });

  it('unknown top-level key still rejected', async () => {
    const dir = await write('bogus: true');
    await assert.rejects(() => loadProjectConfig(dir));
  });
});
