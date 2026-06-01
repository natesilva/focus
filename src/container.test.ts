import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { configHash, containerName, resolveRunAction } from './container.ts';
import type { FocusConfig } from './config/resolver.ts';
import type { InspectResult } from './runtime/adapter.ts';

const base: FocusConfig = {
  runtime: 'docker',
  tools: ['git', 'node'],
  image: 'ubuntu:24.04',
  network: 'bridge',
};

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
    const a = configHash({ ...base });
    const b = configHash({ ...base });
    assert.equal(a, b);
  });

  it('tool list order does not affect hash', () => {
    const a = configHash({ ...base, tools: ['node', 'git'] });
    const b = configHash({ ...base, tools: ['git', 'node'] });
    assert.equal(a, b);
  });

  it('different tool lists produce different hashes', () => {
    const a = configHash({ ...base, tools: ['git'] });
    const b = configHash({ ...base, tools: ['git', 'ripgrep'] });
    assert.notEqual(a, b);
  });

  it('different base images produce different hashes', () => {
    const a = configHash({ ...base, image: 'ubuntu:24.04' });
    const b = configHash({ ...base, image: 'debian:bookworm-slim' });
    assert.notEqual(a, b);
  });

  it('hash is 16 hex characters', () => {
    assert.match(configHash(base), /^[0-9a-f]{16}$/);
  });

  it('runtime and network fields do not affect hash', () => {
    const a = configHash({ ...base, runtime: 'docker', network: 'bridge' });
    const b = configHash({ ...base, runtime: 'apple-containers', network: 'none' });
    assert.equal(a, b);
  });
});
