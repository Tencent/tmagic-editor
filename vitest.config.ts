import { resolve } from 'path';

import { defineConfig } from 'vitest/config';
import Vue from '@vitejs/plugin-vue';

const r = (p: string) => resolve(__dirname, p);

export default defineConfig({
  plugins: [Vue()],

  test: {
    include: ['./packages/*/tests/**', './runtime/*/tests/**'],
    environment: 'jsdom',
    environmentMatchGlobs: [['packages/cli/**', 'node']],
    coverage: {
      exclude: [
        './runtime/**',
        './playground/**',
        './docs/**',
        './packages/*/types/**',
        './packages/*/tests/**',
        './packages/cli/lib/**',
        './packages/ui/**',
        './packages/ui-react/**',
        './packages/design/**',
        './packages/element-plus-adapter/**',
        './packages/tdesign-vue-next-adapter/**',
      ],
      extension: ['.ts', '.vue'],
    },
  },

  resolve: {
    alias: {
      '@editor': r('./packages/editor/src'),
      '@form': r('./packages/form/src'),
      '@data-source': r('./packages/data-source/src'),
    },
  },
});
