import { resolve } from 'path';

import { defineConfig } from 'vitest/config';
import Vue from '@vitejs/plugin-vue';

const r = (p: string) => resolve(__dirname, p);

export default defineConfig({
  plugins: [Vue()],

  test: {
    include: ['./packages/*/tests/**'],
    environment: 'jsdom',
    coverage: {
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
