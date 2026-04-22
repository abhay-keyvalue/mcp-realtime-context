import { Command } from 'commander';
import { prompt } from 'enquirer';
import chalk from 'chalk';
import ora from 'ora';
import { api } from '../api';
import { getProjectId, getAuthor, isConfigured } from '../config';
import { ContextType, ContextStatus } from '@mcp/shared-types';

export function logCommand(program: Command) {
  program
    .command('log')
    .description('Log context to MCP server')
    .option('-t, --type <type>', 'Context type (api, feature, decision, wip, bug)')
    .option('-s, --status <status>', 'Status (draft, in-progress, finalized)')
    .option('--smart', 'Use AI-powered smart detection')
    .action(async (options) => {
      if (!isConfigured()) {
        console.log(chalk.red('✗ CLI not configured'));
        console.log(chalk.gray('Run'), chalk.cyan('mcp auth login'), chalk.gray('first'));
        return;
      }

      const projectId = getProjectId()!;
      const author = getAuthor()!;

      try {
        let input: string;
        let type: ContextType | undefined;
        let status: ContextStatus | undefined;

        if (options.smart) {
          const answers: any = await prompt({
            type: 'input',
            name: 'input',
            message: 'What are you working on?',
            validate: (value: string) => value.length > 0 || 'Please enter some text',
          });

          input = answers.input;

          const spinner = ora('Creating context with AI detection...').start();
          const result = await api.smartCreate(projectId, input, author);
          spinner.succeed(chalk.green('✓ Context logged successfully'));

          console.log(chalk.cyan('\n📝 Context created:'));
          console.log(chalk.gray('Title:'), result.context.title);
          console.log(chalk.gray('Type:'), chalk.yellow(result.context.type));
          console.log(chalk.gray('Tags:'), result.context.tags.join(', ') || 'None');
          console.log(chalk.gray('Confidence:'), `${result.context.confidence}%`);
          console.log(chalk.gray('ID:'), result.context.id);

        } else {
          const answers: any = await prompt([
            {
              type: 'select',
              name: 'type',
              message: 'Context type:',
              choices: ['api', 'feature', 'decision', 'wip', 'bug'],
              initial: options.type || 'wip',
            },
            {
              type: 'input',
              name: 'title',
              message: 'Title:',
              validate: (value: string) => value.length > 0 || 'Title is required',
            },
            {
              type: 'input',
              name: 'description',
              message: 'Description:',
              validate: (value: string) => value.length > 0 || 'Description is required',
            },
            {
              type: 'select',
              name: 'status',
              message: 'Status:',
              choices: ['draft', 'in-progress', 'finalized'],
              initial: options.status || 'in-progress',
            },
            {
              type: 'input',
              name: 'tags',
              message: 'Tags (comma-separated, optional):',
            },
          ]);

          type = answers.type;
          status = answers.status;
          const tags = answers.tags ? answers.tags.split(',').map((t: string) => t.trim()) : [];

          const spinner = ora('Creating context...').start();
          const context = await api.createContext({
            projectId,
            type,
            title: answers.title,
            description: answers.description,
            status,
            tags,
            author,
            source: 'cli',
          });
          spinner.succeed(chalk.green('✓ Context logged successfully'));

          console.log(chalk.cyan('\n📝 Context created:'));
          console.log(chalk.gray('Title:'), context.title);
          console.log(chalk.gray('Type:'), chalk.yellow(context.type));
          console.log(chalk.gray('Status:'), context.status);
          console.log(chalk.gray('ID:'), context.id);
        }

      } catch (error: any) {
        console.error(chalk.red('✗ Failed to log context:'), error.response?.data?.error || error.message);
      }
    });
}
