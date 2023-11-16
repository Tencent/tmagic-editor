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
      './packages/editor/tests/**',
      './packages/form/tests/unit/utils/**',
      './packages/stage/tests/**',
      './packages/utils/tests/**',
      './packages/data-source/tests/**',
      './packages/dep/tests/**',
    ],
    environment: 'jsdom',
  },

  resolve: {
    alias: {
      '@editor': r('./packages/editor/src'),
      '@form': r('./packages/form/src'),
      '@data-source': r('./packages/data-source/src'),
      '@tmagic/core': r('./packages/core/src'),
      '@tmagic/utils': r('./packages/utils/src'),
      '@tmagic/editor': r('./packages/editor/src'),
      '@tmagic/stage': r('./packages/stage/src'),
      '@tmagic/schema': r('./packages/schema/src'),
      '@tmagic/data-source': r('./packages/data-source/src'),
    },
  },
});
