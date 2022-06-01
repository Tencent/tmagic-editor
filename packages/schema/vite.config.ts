import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      outputDir: 'dist/types',
      include: ['src/**/*'],
      staticImport: true,
      insertTypesEntry: true,
      logDiagnostics: true,
    }),
  ],

  build: {
    sourcemap: true,

    lib: {
      entry: 'src/index.ts',
      name: 'TMagicSchema',
      fileName: 'tmagic-schema',
    },
  },
});
