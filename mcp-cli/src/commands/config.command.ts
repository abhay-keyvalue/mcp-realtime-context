import { Command } from 'commander';
import { prompt } from 'enquirer';
import chalk from 'chalk';
import {
  getServerUrl,
  setServerUrl,
  getToken,
  getProjectId,
  getAuthor,
  clearConfig,
  isConfigured,
} from '../config';

export function configCommand(program: Command) {
  const configCmd = program.command('config').description('Manage CLI configuration');

  configCmd
    .command('show')
    .description('Show current configuration')
    .action(() => {
      console.log(chalk.bold('\n📋 Current Configuration:\n'));
      console.log(chalk.cyan('Server URL:'), getServerUrl());
      console.log(chalk.cyan('Token:'), getToken() ? chalk.green('✓ Set') : chalk.red('✗ Not set'));
      console.log(chalk.cyan('Project ID:'), getProjectId() || chalk.yellow('Not set'));
      console.log(chalk.cyan('Author:'), getAuthor() || chalk.yellow('Not set'));
      console.log(chalk.cyan('Status:'), isConfigured() ? chalk.green('✓ Configured') : chalk.yellow('⚠ Incomplete'));
      console.log();
    });

  configCmd
    .command('set-server')
    .description('Set server URL')
    .argument('<url>', 'Server URL')
    .action((url: string) => {
      setServerUrl(url);
      console.log(chalk.green('✓ Server URL updated:'), url);
    });

  configCmd
    .command('clear')
    .description('Clear all configuration')
    .action(async () => {
      const response: any = await prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to clear all configuration?',
      });

      if (response.confirm) {
        clearConfig();
        console.log(chalk.green('✓ Configuration cleared'));
      } else {
        console.log(chalk.yellow('⚠ Cancelled'));
      }
    });
}
