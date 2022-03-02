/**
 * Tencent is pleased to support the open source community by making MagicAdmin available.
 * Copyright (C) 2022 THL A29 Limited, a Tencent company. All rights reserved.
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

const path = require('path');

module.exports = {
  lintOnSave: true,

  indexPath: 'index.html',

  outputDir: path.resolve(__dirname, './dist'),

  devServer: {
    overlay: {
      warnings: false,
      errors: false,
    },
    port: 8181,
    disableHostCheck: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001/',
        ws: true,
        changOrigin: true,
      },
      '^/runtime/vue2': {
        target: 'http://127.0.0.1:80/runtime/vue2',
        changeOrigin: true,
        prependPath: false,
      },
      '^/runtime/vue3': {
        target: 'http://127.0.0.1:80/runtime/vue3',
        changeOrigin: true,
        prependPath: false,
      },
    },
  },
  transpileDependencies: [/@tencent[\\/]magic/],

  configureWebpack: {
    devtool: 'source-map',
    entry: '@src/main.ts',

    resolve: {
      alias: {
        vue$: path.resolve(__dirname, './node_modules/vue/dist/vue.runtime.esm-bundler.js'),
        '@src': path.resolve(__dirname, './src'),
      },
    },
  },
};
