import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeTag, generateDockerfile } from './image-builder.ts';
import type { Profile } from './profiles/types.ts';

const git: Profile = { name: 'git', install: ['apt-get install -y git'], volumes: [], files: {} };
const ripgrep: Profile = { name: 'ripgrep', install: ['apt-get install -y ripgrep'], volumes: [], files: {} };
const multi: Profile = { name: 'node', install: ['apt-get install -y curl', 'npm install -g pnpm'], volumes: [], files: {} };

describe('computeTag', () => {
  it('same inputs produce the same tag', () => {
    const tag1 = computeTag([git, ripgrep], 'ubuntu:24.04');
    const tag2 = computeTag([git, ripgrep], 'ubuntu:24.04');
    assert.equal(tag1, tag2);
  });

  it('input order does not affect the tag (sorted internally)', () => {
    const tag1 = computeTag([ripgrep, git], 'ubuntu:24.04');
    const tag2 = computeTag([git, ripgrep], 'ubuntu:24.04');
    assert.equal(tag1, tag2);
  });

  it('different base image produces different tag', () => {
    const tag1 = computeTag([git], 'ubuntu:24.04');
    const tag2 = computeTag([git], 'debian:bookworm-slim');
    assert.notEqual(tag1, tag2);
  });

  it('different profile list produces different tag', () => {
    const tag1 = computeTag([git], 'ubuntu:24.04');
    const tag2 = computeTag([git, ripgrep], 'ubuntu:24.04');
    assert.notEqual(tag1, tag2);
  });

  it('changed install steps produce a different tag', () => {
    const gitV2: Profile = { ...git, install: [...git.install, 'git config --global core.autocrlf false'] };
    assert.notEqual(computeTag([git], 'ubuntu:24.04'), computeTag([gitV2], 'ubuntu:24.04'));
  });

  it('tag format is focus-built:<12-char-hex>', () => {
    const tag = computeTag([git], 'ubuntu:24.04');
    assert.match(tag, /^focus-built:[0-9a-f]{12}$/);
  });
});

describe('generateDockerfile', () => {
  it('starts with FROM line', () => {
    const df = generateDockerfile([git], 'ubuntu:24.04');
    assert.ok(df.startsWith('FROM ubuntu:24.04\n'));
  });

  it('produces one RUN block per profile', () => {
    const df = generateDockerfile([git, ripgrep], 'ubuntu:24.04');
    const runLines = df.split('\n').filter(l => l.startsWith('RUN '));
    assert.equal(runLines.length, 2);
  });

  it('joins multi-command install array with &&', () => {
    const df = generateDockerfile([multi], 'ubuntu:24.04');
    assert.ok(df.includes('apt-get install -y curl && npm install -g pnpm'));
  });

  it('profiles appear in the order provided', () => {
    const df = generateDockerfile([ripgrep, git], 'ubuntu:24.04');
    const rgPos = df.indexOf('apt-get install -y ripgrep');
    const gitPos = df.indexOf('apt-get install -y git');
    assert.ok(rgPos < gitPos, 'ripgrep RUN block should come before git (input order)');
  });

  it('ends with a newline', () => {
    const df = generateDockerfile([git], 'ubuntu:24.04');
    assert.ok(df.endsWith('\n'));
  });
});
