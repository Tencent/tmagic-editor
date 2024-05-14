import pico from 'picocolors';

export const info = (msg: string) => {
  console.log(pico.white(msg));
};

export const error = (msg: string) => {
  console.log(pico.red(msg));
};

export const success = (msg: string) => {
  console.log(pico.green(msg));
};

export const execInfo = (msg: string) => {
  console.log(pico.blue(msg));
};
