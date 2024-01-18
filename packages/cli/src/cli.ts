import { cac } from 'cac';

import { allowTs } from './utils/allowTs';
import { error } from './utils/logger';
import { scripts } from './commands';
import App from './Core';
import { UserConfig } from './types';

/**
 * Wrap raw command to catch errors and exit process
 */
const wrapCommand = (cmd: (...args: any[]) => Promise<App>): typeof cmd => {
  const wrappedCommand: typeof cmd = (...args) =>
    cmd(...args).catch((err) => {
      error(err.stack);
      process.exit(1);
    });
  return wrappedCommand;
};

/**
 * TMagic cli
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

  // register `entry` command
  program.command('entry', 'Start development server').action(wrapCommand(scripts(defaultAppConfig)));

  program.parse(process.argv);
};
