import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build as buildVite } from 'vite';
import vue from '@vitejs/plugin-vue';
import minimist from 'minimist';
import rimraf from 'rimraf';

const args = minimist(process.argv.slice(2));

const toPascalCase = (str) => str.replace(/(^\w|-\w)/g, (text) => text.replace(/-/, '').toUpperCase());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(__dirname, '../packages');
const runtimeDir = path.resolve(__dirname, '../runtime');

if (args.package) {
  const pkgRoot = path.resolve(packagesDir, args.package);
  if (fs.statSync(pkgRoot).isDirectory()) {
    rimraf.sync(path.resolve(packagesDir, `./${args.package}/dist`));

    build({ packageName: args.package, format: 'es' });
    build({ packageName: args.package, format: 'umd' });
  }
} else {
  const packages = getPackageNames(packagesDir);
  const runtimeHelpers = getPackageNames(runtimeDir);

  for (const packageName of packages) {
    rimraf.sync(path.resolve(packagesDir, `./${packageName}/dist`));
    const pkg = createRequire(import.meta.url)(`../packages/${packageName}/package.json`);

    build({ packageName, format: 'es', pkg, packagesDir });
    build({ packageName, format: 'umd', pkg, packagesDir });
  }

  for (const packageName of runtimeHelpers) {
    rimraf.sync(path.resolve(runtimeDir, `./${packageName}/dist`));
    const pkg = createRequire(import.meta.url)(`../runtime/${packageName}/package.json`);

    build({ packageName, format: 'es', pkg, packagesDir: runtimeDir });
    build({ packageName, format: 'umd', pkg, packagesDir: runtimeDir });
  }
}

async function build({ packageName, format, pkg, packagesDir }) {
  await buildVite({
    root: path.resolve(packagesDir, `./${packageName}`),
    clearScreen: false,
    configFile: false,
    plugins: [vue()],

    build: {
      emptyOutDir: false,
      cssCodeSplit: false,
      sourcemap: false,
      minify: false,
      target: 'esnext',

      lib: {
        entry: 'src/index.ts',
        name: `TMagic${toPascalCase(packageName)}`,
        fileName: `tmagic-${packageName}`,
        formats: [format],
      },

      rollupOptions: {
        // 确保外部化处理那些你不想打包进库的依赖
        external(id) {
          if (format === 'umd' && id === 'lodash-es') {
            return false;
          }
          return Object.keys({
            ...pkg.dependencies,
            ...pkg.peerDependencies,
          }).some((k) => new RegExp(`^${k}`).test(id));
        },

        output: {
          // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
          globals: {
            vue: 'Vue',
            'element-plus': 'ElementPlus',
          },
        },
      },
    },

    resolve: {
      alias: [
        { find: /^@data-source/, replacement: path.join(packagesDir, '/data-source/src') },
        { find: /^@editor/, replacement: path.join(packagesDir, './editor/src') },
      ],
    },
  });
}

function getPackageNames(packagesDir) {
  return fs.readdirSync(packagesDir).filter((p) => {
    const pkgRoot = path.resolve(packagesDir, p);
    if (fs.statSync(pkgRoot).isDirectory()) {
      const pkg = JSON.parse(fs.readFileSync(path.resolve(pkgRoot, 'package.json'), 'utf-8'));
      return !pkg.private && !pkg.bin;
    }
    return false;
  });
}
