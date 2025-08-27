import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import fse from 'fs-extra';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig((mode) => {
  const capitalToken = mode
    .split(':')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('');

  const fileName = mode.replace(':', '-');

  const publicPath = path.resolve(dirname, '../dist/entry', fileName);
  fse.removeSync(publicPath);

  return {
    plugins: [
      {
        name: 'vite-plugin-copy-runtime',
        apply: 'build',
        enforce: 'post',
        closeBundle() {
          fse.copySync(publicPath, path.resolve(dirname, `../../../playground/public/entry/react/${fileName}`));
        },
      },
    ],
    publicDir: './.tmagic/public',
    build: {
      cssCodeSplit: false,
      sourcemap: true,
      minify: false,
      target: 'esnext',
      outDir: `./dist/entry/${fileName}`,

      lib: {
        entry: `.tmagic/${fileName}-entry.ts`,
        name: `magicPreset${capitalToken}s`,
        fileName: 'index',
        formats: ['umd'],
      },
    },
  };
});
