const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,

  lintOnSave: true,

  indexPath: 'index.html',

  outputDir: path.resolve(__dirname, './dist'),

  devServer: {
    port: 80,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001/',
        ws: true,
        changOrigin: true,
      },
      '/static': {
        target: 'http://localhost:3001/',
        ws: true,
        changOrigin: true,
      },
    },
  },

  configureWebpack: {
    devtool: 'source-map',
    entry: '@src/main.ts',

    resolve: {
      alias: {
        vue$: path.resolve(__dirname, './node_modules/vue/dist/vue.runtime.esm-bundler.js'),
        '@src': path.resolve(__dirname, './src'),
      },
    },

    plugins: [new MonacoWebpackPlugin({ languages: ['javascript'] })],
  },
});
