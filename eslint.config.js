import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, globalIgnores } from 'eslint/config';

import eslintConfig from '@tmagic/eslint-config';

export default defineConfig([
  globalIgnores([
    './docs/**/*',
    './packages/cli/lib/**/*',
    '*/**/auto-imports.d.ts',
    '*/**/components.d.ts',
    '*/**/dist/**/*',
    '*/**/.tmagic/**/*',
    '*/**/public/**/*',
    '*/**/types/**/*',
    '*/**/*.config.ts',
    'vite-env.d.ts',
  ]),
  ...eslintConfig(path.join(path.dirname(fileURLToPath(import.meta.url)), 'tsconfig.json')),
  {
    files: ['**/*.vue'],
    rules: {
      'vue/no-mutating-props': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    rules: {
      'no-param-reassign': 'off',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
]);
