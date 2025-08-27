import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build as buildVite } from 'vite';
import fse from 'fs-extra';
import minimist from 'minimist';

import resViteConfig from './vite.res.config.mjs';

const args = minimist(process.argv.slice(2));

const dirname = path.dirname(fileURLToPath(import.meta.url));

const buildList = [];

if (args.type === 'res' || args.type === 'all') {
  fse.removeSync(path.resolve(dirname, '../dist/entry'));

  for (const mode of ['value', 'config', 'event', 'ds:value', 'ds:config', 'ds:event']) {
    buildList.push(
      buildVite({
        root: path.resolve(dirname, '../'),
        clearScreen: false,
        configFile: false,
        ...resViteConfig(mode),
      }),
    );
  }
}

Promise.all(buildList);
