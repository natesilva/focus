import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExecArgs,
  parseInspectOutput,
  parseContainerList,
} from './docker.ts';

describe('buildExecArgs', () => {
  it('uses -it when tty is true', () => {
    const args = buildExecArgs('focus-abc', 1000, undefined, true, undefined, '/work/api-server');
    assert.ok(args.includes('-it'));
    assert.ok(!args.includes('-i') || args.indexOf('-it') === args.indexOf('-i'));
  });

  it('uses -i (no -t) when tty is false', () => {
    const args = buildExecArgs('focus-abc', 1000, ['ls'], false, undefined, '/work/api-server');
    assert.ok(args.includes('-i'));
    assert.ok(!args.includes('-it'));
  });

  it('defaults to /bin/bash when command is undefined', () => {
    const args = buildExecArgs('focus-abc', 1000, undefined, false, undefined, '/work/api-server');
    assert.ok(args.includes('/bin/bash'));
  });

  it('passes --user <uid>', () => {
    const args = buildExecArgs('focus-abc', 1234, ['echo', 'hi'], false, undefined, '/work/api-server');
    const idx = args.indexOf('--user');
    assert.ok(idx !== -1);
    assert.equal(args[idx + 1], '1234');
  });

  it('includes the container name', () => {
    const args = buildExecArgs('focus-abc', 1000, ['echo'], false, undefined, '/work/api-server');
    assert.ok(args.includes('focus-abc'));
  });

  it('passes command args after the container name', () => {
    const args = buildExecArgs('focus-abc', 1000, ['echo', 'hello'], false, undefined, '/work/api-server');
    const nameIdx = args.indexOf('focus-abc');
    assert.equal(args[nameIdx + 1], 'echo');
    assert.equal(args[nameIdx + 2], 'hello');
  });
});

describe('parseInspectOutput', () => {
  it('returns running true and labels for a running container', () => {
    const json = JSON.stringify({
      State: { Running: true },
      Config: { Labels: { 'focus.cwd': '/home/user/project', 'focus.config-hash': 'abc123def456789a' } },
    });
    const result = parseInspectOutput(json);
    assert.equal(result.running, true);
    assert.equal(result.labels['focus.cwd'], '/home/user/project');
    assert.equal(result.labels['focus.config-hash'], 'abc123def456789a');
  });

  it('returns running false for a stopped container', () => {
    const json = JSON.stringify({
      State: { Running: false },
      Config: { Labels: {} },
    });
    assert.equal(parseInspectOutput(json).running, false);
  });

  it('handles null Config.Labels', () => {
    const json = JSON.stringify({ State: { Running: true }, Config: { Labels: null } });
    assert.deepEqual(parseInspectOutput(json).labels, {});
  });
});

describe('parseContainerList', () => {
  it('returns empty array when names list is empty', () => {
    assert.deepEqual(parseContainerList([], '[]'), []);
  });

  it('maps name and cwd from inspect output', () => {
    const inspectJson = JSON.stringify([{
      Name: '/focus-abc123',
      Config: { Labels: { 'focus.cwd': '/home/user/project', 'focus.config-hash': 'deadbeef12345678' } },
    }]);
    const result = parseContainerList(['focus-abc123'], inspectJson);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'focus-abc123');
    assert.equal(result[0].cwd, '/home/user/project');
  });

  it('strips leading slash from container name', () => {
    const inspectJson = JSON.stringify([{
      Name: '/focus-abc123',
      Config: { Labels: { 'focus.cwd': '/some/dir' } },
    }]);
    const result = parseContainerList(['focus-abc123'], inspectJson);
    assert.equal(result[0].name, 'focus-abc123');
  });

  it('filters out containers with no focus.cwd label', () => {
    const inspectJson = JSON.stringify([{
      Name: '/focus-abc123',
      Config: { Labels: { 'focus.config-hash': 'abc' } },
    }]);
    const result = parseContainerList(['focus-abc123'], inspectJson);
    assert.deepEqual(result, []);
  });

  it('handles multiple containers', () => {
    const inspectJson = JSON.stringify([
      { Name: '/focus-aaa', Config: { Labels: { 'focus.cwd': '/dir/a' } } },
      { Name: '/focus-bbb', Config: { Labels: { 'focus.cwd': '/dir/b' } } },
    ]);
    const result = parseContainerList(['focus-aaa', 'focus-bbb'], inspectJson);
    assert.equal(result.length, 2);
    assert.equal(result[1].cwd, '/dir/b');
  });
});
