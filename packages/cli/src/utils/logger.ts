import chalk from 'chalk';

export const info = (msg: string) => {
  console.log(chalk.white(msg));
};

export const error = (msg: string) => {
  console.log(chalk.red(msg));
};

export const success = (msg: string) => {
  console.log(chalk.green(msg));
};

export const execInfo = (msg: string) => {
  console.log(chalk.blue(msg));
};
