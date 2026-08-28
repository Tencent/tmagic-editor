import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build as buildVite } from 'vite';
import vue from '@vitejs/plugin-vue';
import minimist from 'minimist';
import { rimrafSync } from 'rimraf';
import * as sass from 'sass-embedded';

const args = minimist(process.argv.slice(2));

const toPascalCase = (str) => str.replace(/(^\w|-\w)/g, (text) => text.replace(/-/, '').toUpperCase());

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(dirname, '../packages');
const runtimeDir = path.resolve(dirname, '../runtime');

/**
 * 一个包的全部产物。
 *
 * 同一个包内必须串行：umd 与 headless-umd 都写 `dist/`，并发写会互相覆盖
 * （`emptyOutDir: false` 只是不清目录，不解决同时写同名 chunk 的问题）。
 * 包之间仍然并发。
 */
async function buildPackage({ packageName, packagesDir, requirePath }) {
  rimrafSync(path.resolve(packagesDir, `./${packageName}/dist`));
  const pkg = createRequire(import.meta.url)(`${requirePath}/${packageName}/package.json`);

  await build({ packageName, format: 'es', pkg, packagesDir });
  await build({ packageName, format: 'umd', pkg, packagesDir });
  await buildHeadlessUmd({ packageName, pkg, packagesDir });
  buildThemes({ packageName, packagesDir });
}

async function main() {
  if (args.package) {
    const pkgRoot = path.resolve(packagesDir, args.package);
    if (!fs.statSync(pkgRoot).isDirectory()) return;

    await buildPackage({ packageName: args.package, packagesDir, requirePath: '../packages' });
    return;
  }

  await Promise.all([
    ...getPackageNames(packagesDir).map((packageName) =>
      buildPackage({ packageName, packagesDir, requirePath: '../packages' }),
    ),
    ...getPackageNames(runtimeDir).map((packageName) =>
      buildPackage({ packageName, packagesDir: runtimeDir, requirePath: '../runtime' }),
    ),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

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

function buildHeadlessUmd({ packageName, pkg, packagesDir }) {
  const pkgRoot = path.resolve(packagesDir, `./${packageName}`);
  if (!fs.existsSync(path.join(pkgRoot, 'src/headless.ts'))) return;

  return build({
    packageName,
    format: 'umd',
    pkg,
    packagesDir,
    entry: 'src/headless.ts',
    name: `TMagic${toPascalCase(packageName)}Headless`,
    fileName: `tmagic-${packageName}-headless`,
    cssFileName: 'style-headless',
  });
}

async function build({ packageName, format, pkg, packagesDir, entry, name, fileName, cssFileName = 'style' }) {
  const pkgRoot = path.resolve(packagesDir, `./${packageName}`);
  const hasHeadless = !entry && format === 'es' && fs.existsSync(path.join(pkgRoot, 'src/headless.ts'));

  await buildVite({
    root: pkgRoot,
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
        entry: entry ?? (hasHeadless ? { index: 'src/index.ts', headless: 'src/headless.ts' } : 'src/index.ts'),
        name: name ?? `TMagic${toPascalCase(packageName)}`,
        fileName: fileName ?? `tmagic-${packageName}`,
        formats: [format],
        cssFileName,
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

/**
 * 扫描 `<package>/src/theme/themes/<theme>/index.scss`，
 * 为每个主题单独编译输出 `<package>/dist/themes/<theme>.css`。
 *
 * 主题样式独立于主样式包（dist/style.css），消费者通过
 * `import '@tmagic/<pkg>/dist/themes/<theme>.css'` 按需引入，
 * 并在 `<MEditor :theme="..." />` / `<MForm :theme="..." />`
 * 上挂载对应的 `m-editor--<theme>` / `m-form--<theme>` 修饰类后生效。
 */
function buildThemes({ packageName, packagesDir }) {
  const themesDir = path.resolve(packagesDir, `./${packageName}/src/theme/themes`);
  if (!fs.existsSync(themesDir)) return;

  const themes = fs.readdirSync(themesDir).filter((name) => {
    const themePath = path.resolve(themesDir, name);
    return fs.statSync(themePath).isDirectory() && fs.existsSync(path.resolve(themePath, 'index.scss'));
  });
  if (themes.length === 0) return;

  const outputDir = path.resolve(packagesDir, `./${packageName}/dist/themes`);
  fs.mkdirSync(outputDir, { recursive: true });

  // 把 `<pkg>/node_modules` 也加到 loadPaths，使主题 SCSS 内
  // `@use "@tmagic/<pkg>/src/.../index.scss"` 能通过 pnpm 在 node_modules
  // 下的 symlink 解析到对应的源码包。
  const nodeModulesDir = path.resolve(packagesDir, `./${packageName}/node_modules`);
  const loadPaths = [path.resolve(packagesDir, `./${packageName}/src`)];
  if (fs.existsSync(nodeModulesDir)) loadPaths.push(nodeModulesDir);

  for (const theme of themes) {
    const input = path.resolve(themesDir, theme, 'index.scss');
    const result = sass.compile(input, {
      style: 'expanded',
      sourceMap: false,
      loadPaths: [path.resolve(themesDir, theme), ...loadPaths],
    });
    fs.writeFileSync(path.resolve(outputDir, `${theme}.css`), result.css);
    console.log(`[themes] ${packageName}: ${theme}.css`);
  }
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
