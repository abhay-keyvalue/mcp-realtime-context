#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { configCommand } from './commands/config.command';
import { authCommand } from './commands/auth.command';
import { projectCommand } from './commands/project.command';
import { logCommand } from './commands/log.command';
import { listCommand } from './commands/list.command';
import { statsCommand } from './commands/stats.command';

const program = new Command();

program
  .name('mcp')
  .description('MCP Real-Time Context Logger CLI')
  .version('1.0.0');

console.log(chalk.cyan.bold('\n🚀 MCP Context Logger\n'));

configCommand(program);
authCommand(program);
projectCommand(program);
logCommand(program);
listCommand(program);
statsCommand(program);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
