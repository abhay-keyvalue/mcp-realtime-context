import { Command } from 'commander';
import { prompt } from 'enquirer';
import chalk from 'chalk';
import ora from 'ora';
import { api } from '../api';
import { setProjectId, getProjectId } from '../config';

export function projectCommand(program: Command) {
  const projectCmd = program.command('project').description('Project management commands');

  projectCmd
    .command('list')
    .description('List all projects')
    .action(async () => {
      try {
        const spinner = ora('Fetching projects...').start();
        const projects = await api.getProjects();
        spinner.stop();

        if (projects.length === 0) {
          console.log(chalk.yellow('\n⚠ No projects found'));
          console.log(chalk.gray('Create a project with:'), chalk.cyan('mcp project create'));
          return;
        }

        const currentProjectId = getProjectId();

        console.log(chalk.bold('\n📁 Your Projects:\n'));
        projects.forEach((project) => {
          const isCurrent = project.id === currentProjectId;
          const marker = isCurrent ? chalk.green('→') : ' ';
          console.log(`${marker} ${chalk.cyan(project.name)} ${chalk.gray(`(${project.id})`)}`);
          if (project.description) {
            console.log(`   ${chalk.gray(project.description)}`);
          }
        });
        console.log();
      } catch (error: any) {
        console.error(chalk.red('✗ Failed to fetch projects:'), error.response?.data?.error || error.message);
      }
    });

  projectCmd
    .command('create')
    .description('Create a new project')
    .action(async () => {
      try {
        const answers: any = await prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Project name:',
            validate: (value: string) => value.length > 0 || 'Project name is required',
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description (optional):',
          },
        ]);

        const spinner = ora('Creating project...').start();
        const project = await api.createProject(answers.name, answers.description || undefined);
        spinner.succeed(chalk.green('✓ Project created successfully'));

        console.log(chalk.cyan('\nProject ID:'), project.id);
        
        const selectResponse: any = await prompt({
          type: 'confirm',
          name: 'select',
          message: 'Set this as your active project?',
          initial: true,
        });

        if (selectResponse.select) {
          setProjectId(project.id);
          console.log(chalk.green('✓ Active project set'));
        }
      } catch (error: any) {
        console.error(chalk.red('✗ Failed to create project:'), error.response?.data?.error || error.message);
      }
    });

  projectCmd
    .command('select')
    .description('Select active project')
    .action(async () => {
      try {
        const spinner = ora('Fetching projects...').start();
        const projects = await api.getProjects();
        spinner.stop();

        if (projects.length === 0) {
          console.log(chalk.yellow('\n⚠ No projects found'));
          return;
        }

        const response: any = await prompt({
          type: 'select',
          name: 'projectId',
          message: 'Select a project:',
          choices: projects.map((p) => ({
            name: p.id,
            message: `${p.name} ${p.description ? chalk.gray(`- ${p.description}`) : ''}`,
          })),
        });

        setProjectId(response.projectId);
        console.log(chalk.green('✓ Active project set'));
      } catch (error: any) {
        console.error(chalk.red('✗ Failed to select project:'), error.response?.data?.error || error.message);
      }
    });
}
