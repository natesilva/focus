import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { selectRuntime } from './index.ts';
import { DockerRuntimeAdapter } from './docker.ts';
import { AppleContainersRuntimeAdapter } from './apple-containers.ts';

describe('selectRuntime', () => {
  it("'docker' returns DockerRuntimeAdapter", async () => {
    const adapter = await selectRuntime('docker');
    assert.ok(adapter instanceof DockerRuntimeAdapter);
  });

  it("'apple-containers' returns AppleContainersRuntimeAdapter", async () => {
    const adapter = await selectRuntime('apple-containers');
    assert.ok(adapter instanceof AppleContainersRuntimeAdapter);
  });

  it("'auto' on non-darwin returns DockerRuntimeAdapter without probing", async () => {
    if (process.platform === 'darwin') return;
    const adapter = await selectRuntime('auto');
    assert.ok(adapter instanceof DockerRuntimeAdapter);
  });
});
