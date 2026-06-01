import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseInspectOutput, parseContainerList } from './apple-containers.ts';

describe('parseInspectOutput', () => {
  it('returns running true and labels for a running container', () => {
    const json = JSON.stringify([{
      status: 'running',
      configuration: {
        id: 'focus-abc',
        labels: { 'focus.cwd': '/home/user/project', 'focus.config-hash': 'abc123def456789a' },
      },
      networks: [],
    }]);
    const result = parseInspectOutput(json);
    assert.equal(result.running, true);
    assert.equal(result.labels['focus.cwd'], '/home/user/project');
    assert.equal(result.labels['focus.config-hash'], 'abc123def456789a');
  });

  it('returns running false for a stopped container', () => {
    const json = JSON.stringify([{
      status: 'stopped',
      configuration: { id: 'focus-abc', labels: {} },
      networks: [],
    }]);
    assert.equal(parseInspectOutput(json).running, false);
  });

  it('returns running false and empty labels for empty array', () => {
    const result = parseInspectOutput('[]');
    assert.equal(result.running, false);
    assert.deepEqual(result.labels, {});
  });

  it('treats any status other than "running" as not running', () => {
    const json = JSON.stringify([{
      status: 'created',
      configuration: { id: 'focus-abc', labels: {} },
      networks: [],
    }]);
    assert.equal(parseInspectOutput(json).running, false);
  });
});

describe('parseContainerList', () => {
  it('returns empty array for empty list', () => {
    assert.deepEqual(parseContainerList('[]'), []);
  });

  it('maps id and focus.cwd label from list output', () => {
    const json = JSON.stringify([{
      status: 'running',
      configuration: {
        id: 'focus-abc123',
        labels: { 'focus.cwd': '/home/user/project', 'focus.config-hash': 'deadbeef12345678' },
      },
      networks: [],
    }]);
    const result = parseContainerList(json);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'focus-abc123');
    assert.equal(result[0].cwd, '/home/user/project');
  });

  it('filters out containers without focus.cwd label', () => {
    const json = JSON.stringify([{
      status: 'running',
      configuration: { id: 'focus-abc123', labels: { 'focus.config-hash': 'abc' } },
      networks: [],
    }]);
    assert.deepEqual(parseContainerList(json), []);
  });

  it('handles multiple containers', () => {
    const json = JSON.stringify([
      {
        status: 'running',
        configuration: { id: 'focus-aaa', labels: { 'focus.cwd': '/dir/a' } },
        networks: [],
      },
      {
        status: 'running',
        configuration: { id: 'focus-bbb', labels: { 'focus.cwd': '/dir/b' } },
        networks: [],
      },
    ]);
    const result = parseContainerList(json);
    assert.equal(result.length, 2);
    assert.equal(result[0].name, 'focus-aaa');
    assert.equal(result[1].cwd, '/dir/b');
  });

  it('includes only containers with focus.cwd when mixed', () => {
    const json = JSON.stringify([
      {
        status: 'running',
        configuration: { id: 'focus-aaa', labels: { 'focus.cwd': '/dir/a' } },
        networks: [],
      },
      {
        status: 'running',
        configuration: { id: 'other-container', labels: {} },
        networks: [],
      },
    ]);
    const result = parseContainerList(json);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'focus-aaa');
  });
});
