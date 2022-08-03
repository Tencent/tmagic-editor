import { allowTs, info } from '@vuepress/cli';
import { cac } from 'cac';
import chalk from 'chalk';

import { scripts } from './commands';
import { UserConfig } from './types';

/**
 * Wrap raw command to catch errors and exit process
 */
const wrapCommand = (cmd: (...args: any[]) => Promise<void>): typeof cmd => {
  const wrappedCommand: typeof cmd = (...args) =>
    cmd(...args).catch((err) => {
      console.error(chalk.red(err.stack));
      process.exit(1);
    });
  return wrappedCommand;
};

/**
 * Vuepress cli
 */
export const cli = (defaultAppConfig: UserConfig): void => {
  // allow ts files globally
  allowTs();

  // create cac instance
  const program = cac('tmagic');

  // display core version and cli version
  const versionCli = require('../package.json').version;
  program.version(`tmagic/cli@${versionCli}`);

  // display help message
  program.help();

  // register `dev` command
  program.command('entry', 'Start development server').action(wrapCommand(scripts(defaultAppConfig)));

  // register `info` command
  program.command('info', 'Display environment information').action(wrapCommand(info));

  program.parse(process.argv);
};
