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
import legacy from '@vitejs/plugin-legacy';
import reactRefresh from '@vitejs/plugin-react-refresh';

export default defineConfig(({ mode }) => {
  if (['value', 'config', 'event', 'value:admin', 'config:admin', 'event:admin'].includes(mode)) {
    const [type, isAdmin] = mode.split(':');
    const capitalToken = type.charAt(0).toUpperCase() + type.slice(1);
    return {
      publicDir: './.tmagic/public',
      build: {
        cssCodeSplit: false,
        sourcemap: true,
        minify: false,
        target: 'esnext',
        outDir: isAdmin ? `./dist/entry/react/${type}` : `../../playground/public/entry/react/${type}`,

        lib: {
          entry: `.tmagic/${type}-entry.ts`,
          name: `magicPreset${capitalToken}s`,
          fileName: 'index',
          formats: ['umd'],
        },
      },
    };
  }

  if (['page', 'playground', 'page:admin', 'playground:admin'].includes(mode)) {
    const [type, isAdmin] = mode.split(':');
    const base = isAdmin ? `/runtime/${type}/` : `/tmagic-editor/playground/runtime/react/${type}`;
    const outDir = isAdmin
      ? path.resolve(process.cwd(), `./dist/${type}`)
      : path.resolve(process.cwd(), `../../playground/public/runtime/react/${type}`);
    return {
      plugins: [
        reactRefresh(),
        legacy({
          targets: ['defaults', 'not IE 11'],
        }),
      ],

      root: `./${type}/`,

      publicDir: '../public',

      base,

      build: {
        emptyOutDir: true,
        sourcemap: true,
        outDir,
      },
    };
  }

  return {};
});
