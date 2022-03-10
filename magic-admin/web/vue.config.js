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
