/**
 * 校验各包 headless 子路径的**发布产物**能在原生 Node 里跑起来。
 *
 * 单测走 vitest，别名指向 `src`、依赖由 vite 解析，看不到 Node 自己的 ESM 解析规则
 * （例如 `dayjs/plugin/utc` 这种无 exports 映射、又不带扩展名的深路径会直接 404）。
 * 这里在真实的 node_modules 里 `import` / `require` 一次 dist，把这类只在发布后
 * 才暴露的问题挡在构建阶段。
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { execa } from 'execa';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');

/** 每个子路径入口应该导出的若干个符号，顺带验证产物不是空壳 */
const targets = [
  { specifier: '@tmagic/design/headless', expects: ['getDesignConfig', 'appendValidateSuggestion'] },
  { specifier: '@tmagic/form/headless', expects: ['validateForm', 'submitForm', 'registerField', 'builtInFields'] },
  { specifier: '@tmagic/editor/headless', expects: ['editorFields'] },
];

/**
 * 找工作区里该包自己的目录当 cwd。
 *
 * 在包根里 `import '@tmagic/xxx/headless'` 走的是 Node 的 self-reference：
 * 命中的仍是包自己 `exports` 里声明的那份产物路径，同时深层裸依赖按 realpath
 * 从 `<pkg>/node_modules` 解析。比挑一个「依赖了该包的目录」更可靠——依赖方的
 * 链接可能指向 registry 上的同名旧版本，那样检查的就是别人的产物了。
 */
const findPackageDir = (specifier) => {
  const pkgName = specifier.split('/').slice(0, 2).join('/');
  const groups = ['packages', 'runtime', 'vue-components', 'react-components'].filter((group) =>
    existsSync(path.join(root, group)),
  );

  for (const group of groups) {
    for (const name of readdirSync(path.join(root, group))) {
      const manifest = path.join(root, group, name, 'package.json');
      if (!existsSync(manifest)) continue;
      if (JSON.parse(readFileSync(manifest, 'utf-8')).name === pkgName) {
        return path.join(root, group, name);
      }
    }
  }
};

const run = async (cwd, code) => {
  const { stdout } = await execa('node', ['--input-type=module', '-e', code], { cwd });
  return stdout;
};

let failed = 0;

for (const { specifier, expects } of targets) {
  const cwd = findPackageDir(specifier);
  if (!cwd) {
    console.error(`✗ ${specifier}: 工作区里找不到这个包`);
    failed += 1;
    continue;
  }

  const assertExports = `
    const missing = ${JSON.stringify(expects)}.filter((name) => mod[name] === undefined);
    if (missing.length) throw new Error('missing exports: ' + missing.join(', '));
  `;

  for (const [kind, code] of [
    ['import', `const mod = await import('${specifier}');${assertExports}`],
    [
      'require',
      `const { createRequire } = await import('node:module');
       const mod = createRequire(process.cwd() + '/index.js')('${specifier}');${assertExports}`,
    ],
  ]) {
    try {
      await run(cwd, code);
      console.log(`✓ ${kind} '${specifier}'`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${kind} '${specifier}'\n${error.stderr || error.message}`);
    }
  }
}

if (failed) {
  console.error(`\n${failed} 个 headless 产物检查失败`);
  process.exit(1);
}
