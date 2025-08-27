import path from 'node:path';

import { defineConfig } from 'vite';
import fse from 'fs-extra';

import baseConfig from '../vite.config';

export default defineConfig({
  ...baseConfig,

  plugins: [
    ...(baseConfig.plugins || []),
    {
      name: 'vite-plugin-copy-runtime',
      apply: 'build',
      enforce: 'post',
      closeBundle() {
        const clientFile = path.resolve(__dirname, '../dist/playground')
        fse.copySync(clientFile, path.resolve(__dirname, '../../../playground/public/runtime/react/playground'))
      },
    }
  ],

  root: './playground',

  publicDir: '../public',

  base: `${baseConfig.base}/playground`,

  build: {
    emptyOutDir: false,
    sourcemap: true,
    outDir: '../dist/playground',
  },
});
