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

import pkg from './package.json';

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: [{ find: /^@data-source/, replacement: path.join(__dirname, './src') }],
  },

  build: {
    cssCodeSplit: false,
    sourcemap: false,
    minify: false,
    target: 'esnext',

    lib: {
      entry: 'src/index.ts',
      name: 'TMagicDataSource',
      fileName: 'tmagic-data-source',
    },

    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external(id: string) {
        if (mode === 'umd' && id === 'lodash-es') {
          return false;
        }
        return Object.keys({
          ...pkg.dependencies,
          ...pkg.peerDependencies,
        }).some((k) => new RegExp(`^${k}`).test(id));
      },
    },
  },
}));
