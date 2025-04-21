import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import parserTs from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import tencentEslintBaseConfig from './flat/base.mjs';
import tencentEslintImportexport from './flat/import.mjs';
import ImportSortConfig from './flat/import-sort.mjs';
import tencentEslintPrettierConfig from './flat/prettier.mjs';
import tencentEslintTsConfig from './flat/ts.mjs';

export default (tsconfigRootDir) =>
  defineConfig([
    { files: ['**/*.{js,mjs,cjs}'], plugins: { js }, extends: ['js/recommended'] },
    { files: ['**/*.{js,mjs,cjs,ts,vue}'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    ...tseslint.config(tencentEslintBaseConfig, tencentEslintImportexport, tseslint.configs.base, {
      plugins: {
        '@stylistic': stylistic,
        '@stylistic/ts': stylisticTs,
      },
      languageOptions: {
        parser: parserTs,
        parserOptions: {
          project: tsconfigRootDir,
        },
      },
      ...tencentEslintTsConfig,
    }),
    pluginVue.configs['flat/essential'],
    { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } },
    eslintPluginPrettierRecommended,
    tencentEslintPrettierConfig,
    ImportSortConfig,
  ]);
