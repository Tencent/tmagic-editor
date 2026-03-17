import { defineConfig } from 'vite';

import baseConfig from '../vite.config';

export default defineConfig({
  ...baseConfig,

  publicDir: '../public',

  base: `${baseConfig.base}/playground`,

  build: {
    emptyOutDir: false,
    sourcemap: true,
    outDir: '../dist/playground',
  },
});
