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
import reactRefresh from '@vitejs/plugin-react-refresh';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/tmagic-editor/playground/runtime/react',
  plugins: [reactRefresh()],

  resolve: {
    alias: [
      { find: /^react$/, replacement: path.join(__dirname, 'node_modules/react/index.js') },
      { find: /^react-dom$/, replacement: path.join(__dirname, 'node_modules/react-dom/index.js') },
      { find: /^@tmagic\/ui-react/, replacement: path.join(__dirname, '../../packages/ui-react/src/index.ts') },
      { find: /^@tmagic\/utils/, replacement: path.join(__dirname, '../../packages/utils/src/index.ts') },
      { find: /^@tmagic\/core/, replacement: path.join(__dirname, '../../packages/core/src/index.ts') },
      { find: /^@tmagic\/schema/, replacement: path.join(__dirname, '../../packages/schema/src/index.ts') },
    ],
  },

  server: {
    host: '0.0.0.0',
    port: 8090,
  },

  build: {
    rollupOptions: {
      input: {
        page: './page.html',
        playground: './playground.html',
        components: './src/comp-entry.ts',
        config: './src/config-entry.ts',
        value: './src/value-entry.ts',
        event: './src/event-entry.ts',
      },
      output: {
        entryFileNames: 'assets/[name].js',
      },
    },
  },
});
