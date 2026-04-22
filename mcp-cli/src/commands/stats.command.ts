import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { api } from '../api';
import { getProjectId, isConfigured } from '../config';

export function statsCommand(program: Command) {
  program
    .command('stats')
    .description('Show project statistics')
    .action(async () => {
      if (!isConfigured()) {
        console.log(chalk.red('✗ CLI not configured'));
        return;
      }

      const projectId = getProjectId()!;

      try {
        const spinner = ora('Fetching statistics...').start();
        const stats = await api.getStats(projectId);
        spinner.stop();

        console.log(chalk.bold('\n📊 Project Statistics:\n'));
        console.log(chalk.cyan('Total Contexts:'), chalk.bold(stats.total));
        console.log(chalk.cyan('Active Authors:'), chalk.bold(stats.activeAuthors));
        console.log(chalk.cyan('Recent Updates (24h):'), chalk.bold(stats.recentUpdates));

        console.log(chalk.bold('\n📝 By Type:'));
        console.log(chalk.blue('  API:'), stats.byType.api);
        console.log(chalk.green('  Feature:'), stats.byType.feature);
        console.log(chalk.magenta('  Decision:'), stats.byType.decision);
        console.log(chalk.yellow('  WIP:'), stats.byType.wip);
        console.log(chalk.red('  Bug:'), stats.byType.bug);

        console.log(chalk.bold('\n🔄 By Status:'));
        console.log(chalk.gray('  Draft:'), stats.byStatus.draft);
        console.log(chalk.yellow('  In Progress:'), stats.byStatus['in-progress']);
        console.log(chalk.green('  Finalized:'), stats.byStatus.finalized);

        console.log();

      } catch (error: any) {
        console.error(chalk.red('✗ Failed to fetch stats:'), error.response?.data?.error || error.message);
      }
    });
}
