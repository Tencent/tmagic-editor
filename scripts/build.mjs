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

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(dirname, '../packages');
const runtimeDir = path.resolve(dirname, '../runtime');

if (args.package) {
  const pkgRoot = path.resolve(packagesDir, args.package);
  if (fs.statSync(pkgRoot).isDirectory()) {
    rimraf.sync(path.resolve(packagesDir, `./${args.package}/dist`));
    const pkg = createRequire(import.meta.url)(`../packages/${args.package}/package.json`);

    build({ packageName: args.package, format: 'es', pkg, packagesDir });
    build({ packageName: args.package, format: 'umd', pkg, packagesDir });
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

// rolldown 在 UMD 输出顶部会注入
//   Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
// 当内联的依赖（如 lodash-es 的 _Symbol.js）声明 `var Symbol = root.Symbol;`
// 时，由于 var hoisting，该局部 `Symbol` 会把上面一行引用到的全局 `Symbol`
// 遮蔽掉（此时局部变量还未赋值），运行时抛出
//   TypeError: Cannot read properties of undefined (reading 'toStringTag')
// 这里通过后处理把该引用改为 `globalThis.Symbol.toStringTag`，绕开被 hoist
// 的局部绑定。rolldown 修好前先用此 workaround。
function fixUmdSymbolShadow() {
  return {
    name: 'tmagic:fix-umd-symbol-shadow',
    generateBundle(outputOptions, bundle) {
      if (outputOptions.format !== 'umd') return;
      for (const file of Object.values(bundle)) {
        if (file.type !== 'chunk' || typeof file.code !== 'string') continue;
        file.code = file.code.replace(
          /Object\.defineProperty\(exports,\s*Symbol\.toStringTag,/g,
          'Object.defineProperty(exports, globalThis.Symbol.toStringTag,',
        );
      }
    },
  };
}

async function build({ packageName, format, pkg, packagesDir }) {
  await buildVite({
    root: path.resolve(packagesDir, `./${packageName}`),
    clearScreen: false,
    configFile: false,
    plugins: [vue()],

    build: {
      outDir: format === 'es' ? 'dist/es' : 'dist',
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
        cssFileName: 'style',
      },

      rolldownOptions: {
        plugins: [fixUmdSymbolShadow()],
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
          // ES 格式保留模块结构，让消费者的 bundler 按模块粒度 tree-shake
          ...(format === 'es'
            ? {
                preserveModules: true,
                preserveModulesRoot: 'src',
                entryFileNames: '[name].js',
              }
            : {}),
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
