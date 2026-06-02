import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildVolumeFlags, buildEnvFlags, buildExecArgs } from './docker.ts';

describe('docker volume flag generation', () => {
  it('appends :ro for read-only mounts', () => {
    const flags = buildVolumeFlags([
      { hostPath: '/host/gitconfig', containerPath: '/etc/gitconfig', readOnly: true },
    ]);
    assert.deepEqual(flags, ['-v', '/host/gitconfig:/etc/gitconfig:ro']);
  });

  it('does not append :ro for writable mounts', () => {
    const flags = buildVolumeFlags([
      { hostPath: '/host/claude', containerPath: '/home/focususer/.claude', readOnly: false },
    ]);
    assert.deepEqual(flags, ['-v', '/host/claude:/home/focususer/.claude']);
  });

  it('produces two -v pairs for two mounts', () => {
    const flags = buildVolumeFlags([
      { hostPath: '/host/a', containerPath: '/container/a', readOnly: false },
      { hostPath: '/host/b', containerPath: '/container/b', readOnly: true },
    ]);
    assert.equal(flags.length, 4);
    assert.equal(flags[1], '/host/a:/container/a');
    assert.equal(flags[3], '/host/b:/container/b:ro');
  });

  it('returns empty array for no mounts', () => {
    const flags = buildVolumeFlags([]);
    assert.deepEqual(flags, []);
  });
});

describe('buildEnvFlags', () => {
  it('produces -e KEY=VALUE pairs', () => {
    const flags = buildEnvFlags({ TERM: 'xterm-256color', COLORTERM: 'truecolor' });
    assert.ok(flags.includes('-e'));
    assert.ok(flags.includes('TERM=xterm-256color'));
    assert.ok(flags.includes('COLORTERM=truecolor'));
  });

  it('returns empty array for undefined', () => {
    assert.deepEqual(buildEnvFlags(undefined), []);
  });

  it('returns empty array for empty object', () => {
    assert.deepEqual(buildEnvFlags({}), []);
  });
});

describe('buildExecArgs', () => {
  it('uses /work/<dirname> as workdir', () => {
    const args = buildExecArgs('focus-abc', 1000, undefined, false, undefined, '/work/api-server');
    const wdIdx = args.indexOf('--workdir');
    assert.ok(wdIdx !== -1, '--workdir flag should be present');
    assert.equal(args[wdIdx + 1], '/work/api-server');
  });

  it('uses -it flags when tty is true', () => {
    const args = buildExecArgs('focus-abc', 1000, undefined, true, undefined, '/work/api-server');
    assert.ok(args.includes('-it'));
  });

  it('uses -i flag when tty is false', () => {
    const args = buildExecArgs('focus-abc', 1000, undefined, false, undefined, '/work/api-server');
    assert.ok(args.includes('-i'));
    assert.ok(!args.includes('-it'));
  });

  it('appends the provided command', () => {
    const args = buildExecArgs('focus-abc', 1000, ['npm', 'test'], false, undefined, '/work/api-server');
    assert.ok(args.includes('npm'));
    assert.ok(args.includes('test'));
  });
});
