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
        const clientFile = path.resolve(__dirname, '../dist/page')
        fse.copySync(clientFile, path.resolve(__dirname, '../../../playground/public/runtime/vue/runtime/page'))
      },
    }
  ],

  root: './page',

  publicDir: '../public',

  base: `${baseConfig.base}/page`,

  build: {
    emptyOutDir: false,
    sourcemap: true,
    outDir: '../dist/page',
  },
});
