import { defineConfig } from 'vite';

import baseConfig from '../vite.config';

export default defineConfig({
  ...baseConfig,

  root: './page',

  publicDir: '../public',

  base: `${baseConfig.base}/page`,

  build: {
    emptyOutDir: false,
    sourcemap: true,
    outDir: '../dist/page',
  },
});
