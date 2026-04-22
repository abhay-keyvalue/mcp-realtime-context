import { Command } from 'commander';
import { prompt } from 'enquirer';
import chalk from 'chalk';
import ora from 'ora';
import { api } from '../api';
import { setToken, setAuthor } from '../config';

export function authCommand(program: Command) {
  const authCmd = program.command('auth').description('Authentication commands');

  authCmd
    .command('login')
    .description('Login to MCP server')
    .action(async () => {
      try {
        const answers: any = await prompt([
          {
            type: 'input',
            name: 'email',
            message: 'Email:',
            validate: (value: string) => value.includes('@') || 'Please enter a valid email',
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password:',
          },
        ]);

        const spinner = ora('Logging in...').start();

        const result = await api.login(answers.email, answers.password);

        setToken(result.token);
        setAuthor(result.user.name);

        spinner.succeed(chalk.green('✓ Logged in successfully'));
        console.log(chalk.cyan('\nWelcome,'), chalk.bold(result.user.name));
        console.log(chalk.gray('Use'), chalk.yellow('mcp project select'), chalk.gray('to choose a project'));
      } catch (error: any) {
        console.error(chalk.red('✗ Login failed:'), error.response?.data?.error || error.message);
        process.exit(1);
      }
    });

  authCmd
    .command('register')
    .description('Register a new account')
    .action(async () => {
      try {
        const answers: any = await prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Full Name:',
            validate: (value: string) => value.length > 0 || 'Name is required',
          },
          {
            type: 'input',
            name: 'email',
            message: 'Email:',
            validate: (value: string) => value.includes('@') || 'Please enter a valid email',
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password:',
            validate: (value: string) => value.length >= 8 || 'Password must be at least 8 characters',
          },
        ]);

        const spinner = ora('Creating account...').start();

        const result = await api.register(answers.email, answers.password, answers.name);

        setToken(result.token);
        setAuthor(result.user.name);

        spinner.succeed(chalk.green('✓ Account created successfully'));
        console.log(chalk.cyan('\nWelcome,'), chalk.bold(result.user.name));
        console.log(chalk.gray('Use'), chalk.yellow('mcp project create'), chalk.gray('to create your first project'));
      } catch (error: any) {
        console.error(chalk.red('✗ Registration failed:'), error.response?.data?.error || error.message);
        process.exit(1);
      }
    });
}
