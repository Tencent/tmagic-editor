import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build as buildVite } from 'vite';
import fse from 'fs-extra';
import minimist from 'minimist';

import resViteConfig from './vite.res.config.mjs';

const args = minimist(process.argv.slice(2));

const dirname = path.dirname(fileURLToPath(import.meta.url));

fse.removeSync(path.resolve(dirname, '../.tmagic'));

execSync('tmagic entry', {
  stdio: 'inherit',
  cwd: path.resolve(dirname, '../'),
});

if (args.type === 'res' || args.type === 'all') {
  fse.removeSync(path.resolve(dirname, '../dist/entry'));
  for (const mode of ['value', 'config', 'event', 'ds:value', 'ds:config', 'ds:event']) {
    const fileName = mode.replace(':', '-');

    buildVite({
      root: path.resolve(dirname, '../'),
      clearScreen: false,
      configFile: false,
      ...resViteConfig(mode),
    }).then(() => {
      fse.copySync(
        path.resolve(dirname, '../dist/entry', fileName),
        path.resolve(dirname, '../../../playground/public/entry/vue/', fileName),
      );
    });
  }
}

const buildRuntime = (type) => {
  fse.removeSync(path.resolve(dirname, '../dist', type));

  buildVite({
    root: path.resolve(dirname, '../', type),
    clearScreen: false,
    configFile: path.resolve(dirname, '../', type, 'vite.config.ts'),
  }).then(() => {
    const clientFile = path.resolve(dirname, '../dist', type);
    fse.copySync(clientFile, path.resolve(dirname, '../../../playground/public/runtime/vue', type));
  });
};

if (args.type === 'page' || args.type === 'all') {
  buildRuntime('page');
}

if (args.type === 'playground' || args.type === 'all') {
  buildRuntime('playground');
}
