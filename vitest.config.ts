import { resolve } from 'path';

import { defineConfig } from 'vitest/config';
import Vue from '@vitejs/plugin-vue';

const r = (p: string) => resolve(__dirname, p);

export default defineConfig({
  plugins: [Vue()],

  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      'magic-admin/**',
    ],
    include: [
      './packages/editor/tests/unit/utils/**',
      './packages/editor/tests/unit/services/**',
      './packages/utils/tests/**',
    ],
    environment: 'jsdom',
  },

  resolve: {
    alias: {
      '@editor': r('./packages/editor/src'),
      '@form': r('./packages/form/src'),
    },
  },
});
