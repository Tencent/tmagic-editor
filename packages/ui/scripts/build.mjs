import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pkg from '../package.json' assert { type: 'json' };

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const packages = [
  'button',
  'container',
  'img',
  'iterator-container',
  'overlay',
  'page',
  'page-fragment',
  'page-fragment-container',
  'qrcode',
  'text',
];

const commonConfig = {
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },

  build: {
    cssCodeSplit: false,
    sourcemap: false,
    minify: false,
    target: 'esnext',

    rollupOptions: {
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
};

const main = async () => {
  await build({
    ...commonConfig,

    root: path.resolve(__dirname, `../`),

    build: {
      ...commonConfig.build,
      outDir: `./dist`,
      lib: {
        entry: './src/index.ts',
        name: 'ui',
        fileName: 'index',
        formats: ['es'],
      },

      rollupOptions: {
        ...commonConfig.build.rollupOptions,

        // 确保外部化处理那些你不想打包进库的依赖
        external(id) {
          return (
            Object.keys({
              ...(pkg.devDependencies || {}),
              ...(pkg.peerDependencies || {}),
            }).some((k) => new RegExp(`^${k}`).test(id)) ||
            `${id}`.startsWith('.') ||
            (`${id}`.startsWith('/') && !id.endsWith('/index.ts'))
          );
        },
      },
    },
  });

  packages.map((packageName) => {
    const config = {
      ...commonConfig,

      plugins: [vue()],

      root: path.resolve(__dirname, `../src/${packageName}`),

      build: {
        ...commonConfig.build,
        outDir: `../../dist/${packageName}`,
        lib: {
          entry: './index.ts',
          name: packageName,
          fileName: 'index',
          formats: ['es'],
        },

        rollupOptions: {
          ...commonConfig.build.rollupOptions,

          // 确保外部化处理那些你不想打包进库的依赖
          external(id) {
            return (
              Object.keys({
                ...(pkg.devDependencies || {}),
                ...(pkg.peerDependencies || {}),
              }).some((k) => new RegExp(`^${k}`).test(id)) || `${id}`.endsWith('./container')
            );
          },
        },
      },
    };
    return build(config);
  });
};

main();
