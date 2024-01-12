import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: false,

    lib: {
      entry: 'src/index.ts',
      name: 'TMagicSchema',
      fileName: 'tmagic-schema',
    },
  },
});
