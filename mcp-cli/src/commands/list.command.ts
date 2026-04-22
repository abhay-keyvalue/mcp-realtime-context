import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { api } from '../api';
import { getProjectId, isConfigured } from '../config';
import { ContextType, ContextStatus } from '@mcp/shared-types';

export function listCommand(program: Command) {
  program
    .command('list')
    .description('List contexts')
    .option('-t, --type <type>', 'Filter by type')
    .option('-s, --status <status>', 'Filter by status')
    .option('-l, --limit <number>', 'Limit results', '20')
    .action(async (options) => {
      if (!isConfigured()) {
        console.log(chalk.red('✗ CLI not configured'));
        return;
      }

      const projectId = getProjectId()!;

      try {
        const spinner = ora('Fetching contexts...').start();
        
        const filters: any = {
          projectId,
          limit: parseInt(options.limit),
        };

        if (options.type) {
          filters.type = options.type as ContextType;
        }

        if (options.status) {
          filters.status = options.status as ContextStatus;
        }

        const contexts = await api.getContexts(filters);
        spinner.stop();

        if (contexts.length === 0) {
          console.log(chalk.yellow('\n⚠ No contexts found'));
          console.log(chalk.gray('Log your first context with:'), chalk.cyan('mcp log'));
          return;
        }

        console.log(chalk.bold(`\n📋 Contexts (${contexts.length}):\n`));

        contexts.forEach((ctx) => {
          const typeColor = {
            api: chalk.blue,
            feature: chalk.green,
            decision: chalk.magenta,
            wip: chalk.yellow,
            bug: chalk.red,
          }[ctx.type] || chalk.white;

          console.log(typeColor(`[${ctx.type.toUpperCase()}]`), chalk.bold(ctx.title));
          console.log(chalk.gray(`  ${ctx.description.substring(0, 100)}${ctx.description.length > 100 ? '...' : ''}`));
          console.log(chalk.gray(`  Status: ${ctx.status} | Author: ${ctx.author} | Confidence: ${ctx.confidence}%`));
          if (ctx.tags.length > 0) {
            console.log(chalk.gray(`  Tags: ${ctx.tags.join(', ')}`));
          }
          console.log(chalk.gray(`  ID: ${ctx.id}`));
          console.log();
        });

      } catch (error: any) {
        console.error(chalk.red('✗ Failed to fetch contexts:'), error.response?.data?.error || error.message);
      }
    });
}
