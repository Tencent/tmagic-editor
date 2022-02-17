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

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],

  resolve: {
    alias: [
      { find: /@editor/, replacement: path.join(__dirname, '../packages/editor/src') },
      {
        find: /^@tmagic\/editor\/src\/theme\/index.scss/,
        replacement: path.join(__dirname, '../packages/editor/src/theme/index.scss'),
      },
      { find: /^@tmagic\/core/, replacement: path.join(__dirname, '../packages/core/src/index.ts') },
      { find: /^@tmagic\/editor/, replacement: path.join(__dirname, '../packages/editor/src/index.ts') },
      { find: /^@tmagic\/schema/, replacement: path.join(__dirname, '../packages/schema/src/index.ts') },
      { find: /^@tmagic\/form/, replacement: path.join(__dirname, '../packages/form/src/index.ts') },
      { find: /^@tmagic\/table/, replacement: path.join(__dirname, '../packages/table/src/index.ts') },
      { find: /^@tmagic\/stage/, replacement: path.join(__dirname, '../packages/stage/src/index.ts') },
      { find: /^@tmagic\/utils/, replacement: path.join(__dirname, '../packages/utils/src/index.ts') },
      { find: /^vue$/, replacement: path.join(__dirname, 'node_modules/vue/dist/vue.esm-bundler.js') },
      { find: /^element-plus$/, replacement: path.join(__dirname, 'node_modules/element-plus/es/index.mjs') },
    ],
  },

  server: {
    fs: {
      strict: false,
    },
    host: '0.0.0.0',
    port: 8098,
    proxy: {
      '^/runtime/react': {
        target: 'http://127.0.0.1:8076',
        changeOrigin: true,
        prependPath: false,
        rewrite: (path: string) => path.replace(/^\/runtime\/react/, ''),
      },
      '^/runtime/vue2': {
        target: 'http://127.0.0.1:8077',
        changeOrigin: true,
        prependPath: false,
        rewrite: (path: string) => path.replace(/^\/runtime\/vue2/, ''),
      },
      '^/runtime/vue3': {
        target: 'http://127.0.0.1:8078',
        changeOrigin: true,
        prependPath: false,
        rewrite: (path: string) => path.replace(/^\/runtime\/vue3/, ''),
      },
    },
  },

  build: {
    sourcemap: true,
  },
});
