import { resolve } from 'path';

import { defineConfig } from 'vitest/config';
import Vue from '@vitejs/plugin-vue';

const r = (p: string) => resolve(__dirname, p);

const alias = {
  '@editor': r('./packages/editor/src'),
  '@form': r('./packages/form/src'),
  '@data-source': r('./packages/data-source/src'),
};

export default defineConfig({
  test: {
    coverage: {
      include: ['packages/*/src/**'],
      exclude: [
        './runtime/**',
        './playground/**',
        './docs/**',
        './packages/*/dist/**',
        './packages/*/types/**',
        './packages/*/tests/**',
        './packages/cli/lib/**',
        './packages/design/**',
        './packages/element-plus-adapter/**',
        './packages/tdesign-vue-next-adapter/**',
      ],
    },
    projects: [
      {
        plugins: [Vue()],
        resolve: { alias },
        test: {
          name: 'dom',
          include: ['./packages/*/tests/**', './runtime/*/tests/**'],
          exclude: ['./packages/cli/tests/**', './packages/editor/tests/unit/hooks/use-stage.spec.ts'],
          environment: 'happy-dom',
          pool: 'vmThreads',
          vmMemoryLimit: '2GB',
          maxWorkers: 8,
          // 配置不同 pool/maxWorkers 的项目需要分到不同 group，否则 vitest 无法调度
          sequence: { groupOrder: 0 },
        },
      },
      {
        plugins: [Vue()],
        resolve: { alias },
        test: {
          name: 'dom-forks',
          include: ['./packages/editor/tests/unit/hooks/use-stage.spec.ts'],
          environment: 'happy-dom',
          pool: 'forks',
          isolate: false,
          sequence: { groupOrder: 1 },
        },
      },
      {
        plugins: [Vue()],
        resolve: { alias },
        test: {
          name: 'node',
          include: ['./packages/cli/tests/**'],
          environment: 'node',
          pool: 'forks',
          isolate: false,
          sequence: { groupOrder: 2 },
        },
      },
    ],
  },
});
