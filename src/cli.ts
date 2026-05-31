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
    const { stopped } = await stopContainer(cwd);
    if (!stopped) {
      console.log('no container running for this directory');
    }
    return;
  }

  if (subcommand === 'status') {
    const { running } = await containerStatus(cwd);
    console.log(running ? 'running' : 'not running');
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
