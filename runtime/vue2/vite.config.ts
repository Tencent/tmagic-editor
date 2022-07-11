/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import path from 'path';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue2';
// @ts-ignore
import externalGlobals from 'rollup-plugin-external-globals';

export default defineConfig(({ command, mode }) => {
  const { WATCH_INCLUDE = '', BASE, OUT_DIR } = loadEnv(mode, process.cwd(), '');
  const libInput = {
    config: './src/config-entry.ts',
    value: './src/value-entry.ts',
    event: './src/event-entry.ts',
  };

  const htmlInput = {
    page: './page.html',
    playground: './playground.html',
  };

  const devInput = mode === 'lib' ? libInput : htmlInput;

  const buildConfig = {
    outDir: OUT_DIR || 'dist',

    sourcemap: true,

    cssCodeSplit: false,

    rollupOptions: {
      input:
        command === 'build' && mode !== 'lib'
          ? {
              ...htmlInput,
              ...libInput,
            }
          : devInput,
      output: {
        entryFileNames: 'assets/[name].js',
      },
    },
  };

  if (mode === 'lib') {
    return {
      build: {
        ...buildConfig,
        watch: {
          include: WATCH_INCLUDE.split(','),
        },
      },
    };
  }

  return {
    base: BASE || '/tmagic-editor/playground/runtime/vue2',

    plugins: [vue(), externalGlobals({ vue: 'Vue' }, { exclude: ['page.html', 'playground.html'] })],

    resolve: {
      alias: [
        { find: /^vue$/, replacement: path.join(__dirname, 'node_modules/vue/dist/vue.esm.js') },
        { find: /^@tmagic\/ui-vue2/, replacement: path.join(__dirname, '../../packages/ui-vue2/src/index.ts') },
        { find: /^@tmagic\/utils/, replacement: path.join(__dirname, '../../packages/utils/src/index.ts') },
        { find: /^@tmagic\/core/, replacement: path.join(__dirname, '../../packages/core/src/index.ts') },
        { find: /^@tmagic\/schema/, replacement: path.join(__dirname, '../../packages/schema/src/index.ts') },
      ],
    },

    publicDir: command === 'serve' ? 'dist' : 'public',

    server: {
      host: '0.0.0.0',
    },

    build: buildConfig,
  };
});
