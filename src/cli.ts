#!/usr/bin/env node

import { realpathSync } from 'node:fs';
import { focusInit } from './commands/init.ts';
import { resolveConfig } from './config/resolver.ts';
import { runContainer, stopContainer, containerStatus } from './container.ts';

const args = process.argv.slice(2);
const cwd = realpathSync(process.cwd());

async function main(): Promise<void> {
  const subcommand = args[0];

  if (subcommand === 'init') {
    await focusInit(cwd);
    return;
  }

  if (subcommand === '--') {
    const command = args.slice(1);
    if (command.length === 0) {
      console.error('focus: no command given after --');
      process.exit(1);
    }
    const config = await resolveConfig(cwd);
    const code = await runContainer(cwd, config, command);
    process.exit(code);
  }

  if (subcommand === 'stop') {
    const config = await resolveConfig(cwd);
    const { stopped } = await stopContainer(cwd, config);
    if (stopped) {
      console.log('container stopped');
    } else {
      console.log('no container running for this directory');
    }
    return;
  }

  if (subcommand === 'status') {
    const config = await resolveConfig(cwd);
    const { running, configCurrent } = await containerStatus(cwd, config);
    if (!running) {
      console.log('not running');
    } else if (configCurrent) {
      console.log('running (config current)');
    } else {
      console.log('running (config changed — run `focus` to rebuild)');
    }
    return;
  }

  if (subcommand === undefined || subcommand === 'run') {
    const config = await resolveConfig(cwd);
    const code = await runContainer(cwd, config);
    process.exit(code);
  }

  console.error(`focus: unknown subcommand '${subcommand}'`);
  console.error('Usage: focus [run|stop|status|init] [-- <cmd> [args...]]');
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error('focus:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
