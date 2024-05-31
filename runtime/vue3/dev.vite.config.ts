/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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

export default defineConfig({
  plugins: [vue(), vueJsx()],

  resolve: {
    alias: [
      { find: /^vue$/, replacement: path.join(__dirname, 'node_modules/vue/dist/vue.esm-bundler.js') },
      {
        find: /^@tmagic\/utils\/resetcss.css/,
        replacement: path.join(__dirname, '../../packages/utils/src/resetcss.css'),
      },
      { find: /^@tmagic\/utils/, replacement: path.join(__dirname, '../../packages/utils/src/index.ts') },
      { find: /^@tmagic\/core/, replacement: path.join(__dirname, '../../packages/core/src/index.ts') },
      { find: /^@tmagic\/data-source/, replacement: path.join(__dirname, '../../packages/data-source/src/index.ts') },
      { find: /^@tmagic\/dep/, replacement: path.join(__dirname, '../../packages/dep/src/index.ts') },
      { find: /^@data-source/, replacement: path.join(__dirname, '../../packages/data-source/src') },
      { find: /^@tmagic\/schema/, replacement: path.join(__dirname, '../../packages/schema/src/index.ts') },
      { find: /^@tmagic\/vue-runtime-help/, replacement: path.join(__dirname, '../vue-runtime-help/src/index.ts') },
    ],
  },

  root: './',

  base: '/tmagic-editor/playground/runtime/vue3/',

  publicDir: 'public',

  optimizeDeps: {
    exclude: ['vue-demi'],
  },

  server: {
    host: '0.0.0.0',
    port: 8078,
    strictPort: true,
  },
});
