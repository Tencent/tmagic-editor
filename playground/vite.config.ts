/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
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
import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],

  base: '/tmagic-editor/playground/',

  resolve: {
    alias: process.env.NODE_ENV === 'development' ? [
      {
        find: /^@tmagic\/editor\/dist\/style.css/,
        replacement: path.join(__dirname, '../packages/editor/src/theme/index.scss'),
      },
      // 开发态：把 `@tmagic/editor/dist/themes/<name>.css` 直接指到对应 SCSS 源码，
      // 这样调主题样式不用先跑 build。$1 来自 `find` 正则的捕获组。
      {
        find: /^@tmagic\/editor\/dist\/themes\/(.+)\.css$/,
        replacement: path.join(__dirname, '../packages/editor/src/theme/themes/$1/index.scss'),
      },
      {
        find: /^@tmagic\/form\/dist\/themes\/(.+)\.css$/,
        replacement: path.join(__dirname, '../packages/form/src/theme/themes/$1/index.scss'),
      },
      // 主题 SCSS 在内部互相 @use 时（例如 editor 的主题里 @use 了 design / form 的主题），
      // 写的是 `@tmagic/<pkg>/src/theme/themes/<name>/index.scss`。这些 SCSS 子路径必须
      // 在下方通用的 `^@tmagic/<pkg>` 规则（指向 `src/index.ts`）之前命中，否则会被
      // 错误改写成 `.../src/index.ts/src/theme/themes/...` 触发 ENOTDIR。
      {
        find: /^@tmagic\/editor\/src\/theme\/themes\/(.+)\/index\.scss$/,
        replacement: path.join(__dirname, '../packages/editor/src/theme/themes/$1/index.scss'),
      },
      {
        find: /^@tmagic\/form\/src\/theme\/themes\/(.+)\/index\.scss$/,
        replacement: path.join(__dirname, '../packages/form/src/theme/themes/$1/index.scss'),
      },
      {
        find: /^@tmagic\/design\/src\/theme\/themes\/(.+)\/index\.scss$/,
        replacement: path.join(__dirname, '../packages/design/src/theme/themes/$1/index.scss'),
      },
      {
        find: /^@tmagic\/form\/src\/theme\/index.scss/,
        replacement: path.join(__dirname, '../packages/form/src/theme/index.scss'),
      },
      {
        find: /^@tmagic\/table\/src\/theme\/index.scss/,
        replacement: path.join(__dirname, '../packages/table/src/theme/index.scss'),
      },
      {
        find: /^@tmagic\/design\/src\/theme\/index.scss/,
        replacement: path.join(__dirname, '../packages/design/src/theme/index.scss'),
      },
      { find: /^@tmagic\/core/, replacement: path.join(__dirname, '../packages/core/src/index.ts') },
      { find: /^@editor/, replacement: path.join(__dirname, '../packages/editor/src/') },
      { find: /^@tmagic\/editor/, replacement: path.join(__dirname, '../packages/editor/src/index.ts') },
      { find: /^@tmagic\/form-schema/, replacement: path.join(__dirname, '../packages/form-schema/src/index.ts') },
      { find: /^@tmagic\/schema/, replacement: path.join(__dirname, '../packages/schema/src/index.ts') },
      { find: /^@tmagic\/form/, replacement: path.join(__dirname, '../packages/form/src/index.ts') },
      {
        find: /^@tmagic\/tmagic-form-runtime/,
        replacement: path.join(__dirname, '../runtime/tmagic-form/src/index.ts'),
      },
      { find: /^@tmagic\/table/, replacement: path.join(__dirname, '../packages/table/src/index.ts') },
      { find: /^@tmagic\/stage/, replacement: path.join(__dirname, '../packages/stage/src/index.ts') },
      { find: /^@tmagic\/utils/, replacement: path.join(__dirname, '../packages/utils/src/index.ts') },
      { find: /^@tmagic\/design/, replacement: path.join(__dirname, '../packages/design/src/index.ts') },
      {
        find: /^@tmagic\/data-source/,
        replacement: path.join(__dirname, '../packages/data-source/src/index.ts'),
      },
      { find: /^@tmagic\/dep/, replacement: path.join(__dirname, '../packages/dep/src/index.ts') },
      { find: /^@data-source/, replacement: path.join(__dirname, '../packages/data-source/src') },
      {
        find: /^@tmagic\/element-plus-adapter/,
        replacement: path.join(__dirname, '../packages/element-plus-adapter/src/index.ts'),
      },
      {
        find: /^@tmagic\/tdesign-vue-next-adapter/,
        replacement: path.join(__dirname, '../packages/tdesign-vue-next-adapter/src/index.ts'),
      },
    ] : [
      { find: 'vue', replacement: path.join(__dirname, './node_modules/vue') },
    ],
  },

  optimizeDeps: {
    rolldownOptions: {
      transform: {
        define: {
          global: 'globalThis',
        },
      },
    },
  },

  css: {
    lightningcss: {
      errorRecovery: true,
    },
  },

  server: {
    host: '0.0.0.0',
    port: 8098,
    strictPort: true,
    proxy: {
      '^/tmagic-editor/playground/runtime': {
        target: 'http://127.0.0.1:8078',
        changeOrigin: true,
        prependPath: false,
      },
    },
    open: '/tmagic-editor/playground/',
  },

  preview: {
    proxy: {},
  },

  build: {
    sourcemap: true,
  },
});
