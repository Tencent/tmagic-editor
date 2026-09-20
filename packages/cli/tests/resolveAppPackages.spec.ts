/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Core from '../src/Core';
import { resolveAppPackages } from '../src/utils/resolveAppPackages';

const writeFile = (filePath: string, content: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

describe('resolveAppPackages', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-resolve-'));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  test('packages 为空时返回空的映射结构', () => {
    const app = new Core({ packages: [], source: tmpRoot, temp: 'tmp' });
    const result = resolveAppPackages(app);
    expect(result).toEqual({
      componentPackage: {},
      componentMap: {},
      configMap: {},
      eventMap: {},
      valueMap: {},
      pluginPakcage: {},
      pluginMap: {},
      datasourcePackage: {},
      datasourceMap: {},
      dsConfigMap: {},
      dsEventMap: {},
      dsValueMap: {},
    });
  });

  test('解析普通组件目录', () => {
    const pkgDir = path.join(tmpRoot, 'my-comp');
    writeFile(
      path.join(pkgDir, 'index.js'),
      "import Foo from './Foo';\nexport default Foo;\nexport const config = {};\nexport const value = {};\n",
    );
    writeFile(path.join(pkgDir, 'Foo.vue'), '<template></template>');

    const app = new Core({
      packages: [{ 'my-comp': pkgDir }],
      source: tmpRoot,
      temp: 'tmp',
      componentFileAffix: '.vue',
    });

    const result = resolveAppPackages(app);

    expect(Object.keys(result.componentPackage)).toContain('my-comp');
    expect(result.componentMap['my-comp']).toBeTruthy();
  });

  test('解析插件 (export default 含 install 的对象)', () => {
    const pkgDir = path.join(tmpRoot, 'my-plugin');
    writeFile(path.join(pkgDir, 'index.js'), 'export default { install() {} };\n');

    const app = new Core({
      packages: [{ 'my-plugin': pkgDir }],
      source: tmpRoot,
      temp: 'tmp',
    });

    const result = resolveAppPackages(app);

    expect(result.pluginPakcage['my-plugin']).toBeTruthy();
    expect(result.pluginMap['my-plugin']).toBeTruthy();
  });

  test('解析数据源 (export default class extends DataSource)', () => {
    const pkgDir = path.join(tmpRoot, 'my-ds');
    writeFile(path.join(pkgDir, 'index.js'), 'export default class MyDataSource extends DataSource {}\n');

    const app = new Core({
      packages: [{ 'my-ds': pkgDir }],
      source: tmpRoot,
      temp: 'tmp',
    });

    const result = resolveAppPackages(app);

    expect(result.datasourcePackage['my-ds']).toBeTruthy();
  });

  test('解析自定义父类的数据源 (datasoucreSuperClass)', () => {
    const pkgDir = path.join(tmpRoot, 'my-custom-ds');
    writeFile(path.join(pkgDir, 'index.js'), 'export default class MyDataSource extends MyBaseDS {}\n');

    const app = new Core({
      packages: [{ 'my-custom-ds': pkgDir }],
      source: tmpRoot,
      temp: 'tmp',
      datasoucreSuperClass: ['MyBaseDS'],
    });

    const result = resolveAppPackages(app);

    expect(result.datasourcePackage['my-custom-ds']).toBeTruthy();
  });

  test('解析组件包 (export default 是包含多个子组件的对象)', () => {
    const pkgDir = path.join(tmpRoot, 'my-pkg');
    writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'my-pkg', main: 'index.js' }));
    writeFile(
      path.join(pkgDir, 'index.js'),
      "import foo from './foo';\nimport bar from './bar';\nexport default { foo, bar };\n",
    );
    writeFile(path.join(pkgDir, 'foo/package.json'), JSON.stringify({ name: 'foo', main: 'index.js' }));
    writeFile(path.join(pkgDir, 'foo/index.js'), "import FooComp from './FooComp';\nexport default FooComp;\n");
    writeFile(path.join(pkgDir, 'foo/FooComp.vue'), '<template></template>');
    writeFile(path.join(pkgDir, 'bar/package.json'), JSON.stringify({ name: 'bar', main: 'index.js' }));
    writeFile(path.join(pkgDir, 'bar/index.js'), "import BarComp from './BarComp';\nexport default BarComp;\n");
    writeFile(path.join(pkgDir, 'bar/BarComp.vue'), '<template></template>');

    const app = new Core({
      packages: [pkgDir],
      source: tmpRoot,
      temp: 'tmp',
      componentFileAffix: '.vue',
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage.foo).toBeTruthy();
    expect(result.componentPackage.bar).toBeTruthy();
  });

  test('组件包中的 npm 包 import 通过进程内 resolve 解析', () => {
    const pkgDir = path.join(tmpRoot, 'my-pkg');
    const depDir = path.join(tmpRoot, 'node_modules', 'dep-comp');

    writeFile(path.join(depDir, 'package.json'), JSON.stringify({ name: 'dep-comp', main: 'index.js' }));
    writeFile(path.join(depDir, 'index.js'), "import Foo from './Foo';\nexport default Foo;\n");
    writeFile(path.join(depDir, 'Foo.vue'), '<template></template>');
    writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'my-pkg', main: 'index.js' }));
    writeFile(path.join(pkgDir, 'index.js'), "import dep from 'dep-comp';\nexport default { dep };\n");

    const app = new Core({
      packages: [pkgDir],
      source: tmpRoot,
      temp: 'tmp',
      componentFileAffix: '.vue',
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage.dep).toBeTruthy();
    expect(result.componentMap.dep).toBeTruthy();
  });

  test('无法解析的 import 不会回退为原始 specifier，也不会拼进 shell', () => {
    const pkgDir = path.join(tmpRoot, 'evil-pkg');
    const marker = path.join(tmpRoot, 'tmagic-cli-pwn');
    const specifier = `x$(touch ${marker})`;

    writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'evil-pkg', main: 'index.js' }));
    writeFile(
      path.join(pkgDir, 'index.js'),
      `import Evil from ${JSON.stringify(specifier)};\nexport default { evil: Evil };\n`,
    );

    const app = new Core({
      packages: [pkgDir],
      source: tmpRoot,
      temp: 'tmp',
      npmConfig: { autoInstall: false },
    });

    expect(() => resolveAppPackages(app)).not.toThrow();
    expect(fs.existsSync(marker)).toBe(false);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('无法解析组件包 import'));

    const result = resolveAppPackages(app);
    expect(result.componentPackage.evil).toBeUndefined();
  });

  test('相对路径不存在的 import 会被跳过', () => {
    const pkgDir = path.join(tmpRoot, 'missing-pkg');
    writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'missing-pkg', main: 'index.js' }));
    writeFile(path.join(pkgDir, 'index.js'), "import Missing from './not-there';\nexport default { Missing };\n");

    const app = new Core({
      packages: [pkgDir],
      source: tmpRoot,
      temp: 'tmp',
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage.Missing).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('无法解析组件包 import'));
  });

  test('空字符串 import specifier 会被跳过', () => {
    const pkgDir = path.join(tmpRoot, 'empty-spec-pkg');
    writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'empty-spec-pkg', main: 'index.js' }));
    writeFile(path.join(pkgDir, 'index.js'), "import Empty from '';\nexport default { Empty };\n");

    const app = new Core({
      packages: [pkgDir],
      source: tmpRoot,
      temp: 'tmp',
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage.Empty).toBeUndefined();
  });

  test('组件包中的 scoped npm 包 import 可以解析', () => {
    const pkgDir = path.join(tmpRoot, 'my-pkg');
    const depDir = path.join(tmpRoot, 'node_modules', '@scope', 'pkg');

    writeFile(path.join(depDir, 'package.json'), JSON.stringify({ name: '@scope/pkg', main: 'index.js' }));
    writeFile(path.join(depDir, 'index.js'), "import Foo from './Foo';\nexport default Foo;\n");
    writeFile(path.join(depDir, 'Foo.vue'), '<template></template>');
    writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'my-pkg', main: 'index.js' }));
    writeFile(path.join(pkgDir, 'index.js'), "import scoped from '@scope/pkg';\nexport default { scoped };\n");

    const app = new Core({
      packages: [pkgDir],
      source: tmpRoot,
      temp: 'tmp',
      componentFileAffix: '.vue',
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage.scoped).toBeTruthy();
    expect(result.componentMap.scoped).toBeTruthy();
  });

  test('npm 组件包再导出相对路径和嵌套 npm 子组件', () => {
    const pkgDir = path.join(tmpRoot, 'ui-kit');
    const formsDir = path.join(tmpRoot, 'node_modules', 'forms-pkg');
    const inputDir = path.join(formsDir, 'node_modules', 'input-pkg');

    writeFile(path.join(inputDir, 'package.json'), JSON.stringify({ name: 'input-pkg', main: 'index.js' }));
    writeFile(path.join(inputDir, 'index.js'), "import Input from './Input';\nexport default Input;\n");
    writeFile(path.join(inputDir, 'Input.vue'), '<template></template>');

    writeFile(path.join(formsDir, 'package.json'), JSON.stringify({ name: 'forms-pkg', main: 'index.js' }));
    writeFile(
      path.join(formsDir, 'index.js'),
      "import Local from './Local';\nimport Remote from 'input-pkg';\nexport default { Local, Remote };\n",
    );
    writeFile(path.join(formsDir, 'Local/index.js'), "import Comp from './Comp';\nexport default Comp;\n");
    writeFile(path.join(formsDir, 'Local/Comp.vue'), '<template></template>');

    writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'ui-kit', main: 'index.js' }));
    writeFile(path.join(pkgDir, 'index.js'), "import forms from 'forms-pkg';\nexport default { forms };\n");

    const app = new Core({
      packages: [pkgDir],
      source: tmpRoot,
      temp: 'tmp',
      componentFileAffix: '.vue',
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage.Local).toBeTruthy();
    expect(result.componentPackage.Remote).toBeTruthy();
  });

  test('解析 import 时非 MODULE_NOT_FOUND 的错误会抛出', () => {
    const pkgDir = path.join(tmpRoot, 'blocked-pkg');
    const depDir = path.join(tmpRoot, 'node_modules', 'blocked-comp');

    writeFile(
      path.join(depDir, 'package.json'),
      JSON.stringify({ name: 'blocked-comp', exports: { './hidden': './index.js' } }),
    );
    writeFile(path.join(depDir, 'index.js'), 'export default {};\n');
    writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'blocked-pkg', main: 'index.js' }));
    writeFile(path.join(pkgDir, 'index.js'), "import blocked from 'blocked-comp';\nexport default { blocked };\n");

    const app = new Core({
      packages: [pkgDir],
      source: tmpRoot,
      temp: 'tmp',
    });

    expect(() => resolveAppPackages(app)).toThrow(/exports/);
  });

  test('字符串形式 packages 没有 key 时仅做解析不写入映射', () => {
    const pkgDir = path.join(tmpRoot, 'no-key-comp');
    writeFile(path.join(pkgDir, 'index.js'), "import Foo from './Foo';\nexport default Foo;\n");
    writeFile(path.join(pkgDir, 'Foo.vue'), '<template></template>');

    const app = new Core({
      packages: [pkgDir],
      source: tmpRoot,
      temp: 'tmp',
      componentFileAffix: '.vue',
    });

    const result = resolveAppPackages(app);

    expect(Object.keys(result.componentPackage)).toHaveLength(0);
  });

  test('packages 为对象但找不到合法 moduleName 时抛错', () => {
    const app = new Core({
      packages: [{ foo: '' }],
      source: tmpRoot,
      temp: 'tmp',
    });

    expect(() => resolveAppPackages(app)).toThrowError(/packages中包含非法配置/);
  });

  test('从 js 文件 import 再 export default 时识别为组件，并解析 config/event/value', () => {
    const pkgDir = path.join(tmpRoot, 'js-comp');
    writeFile(
      path.join(pkgDir, 'index.js'),
      [
        "import Foo from './Foo';",
        "export { config } from './config';",
        "export { event } from './event';",
        "export { value } from './value';",
        'export default Foo;',
        '',
      ].join('\n'),
    );
    writeFile(path.join(pkgDir, 'Foo.js'), 'export default function Foo() {}\n');
    writeFile(path.join(pkgDir, 'config.js'), 'export default {};\n');
    writeFile(path.join(pkgDir, 'event.js'), 'export default {};\n');
    writeFile(path.join(pkgDir, 'value.js'), 'export default {};\n');

    const app = new Core({
      packages: [{ 'js-comp': pkgDir }],
      source: tmpRoot,
      temp: 'tmp',
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage['js-comp']).toBeTruthy();
    expect(result.componentMap['js-comp']).toBeTruthy();
    expect(result.configMap['js-comp']).toBeTruthy();
    expect(result.eventMap['js-comp']).toBeTruthy();
    expect(result.valueMap['js-comp']).toBeTruthy();
  });

  test('export default 指向的模块若是 DataSource 子类则识别为数据源', () => {
    const pkgDir = path.join(tmpRoot, 'imported-ds');
    writeFile(path.join(pkgDir, 'index.js'), "import DS from './ds';\nexport default DS;\n");
    writeFile(path.join(pkgDir, 'ds.js'), 'export default class MyDS extends DataSource {}\n');

    const app = new Core({
      packages: [{ 'imported-ds': pkgDir }],
      source: tmpRoot,
      temp: 'tmp',
    });

    const result = resolveAppPackages(app);

    expect(result.datasourcePackage['imported-ds']).toBeTruthy();
  });

  test('const 声明再 export default 的 install 对象识别为插件', () => {
    const pkgDir = path.join(tmpRoot, 'const-plugin');
    writeFile(path.join(pkgDir, 'index.js'), 'const plugin = { install() {} };\nexport default plugin;\n');

    const app = new Core({
      packages: [{ 'const-plugin': pkgDir }],
      source: tmpRoot,
      temp: 'tmp',
    });

    const result = resolveAppPackages(app);

    expect(result.pluginPakcage['const-plugin']).toBeTruthy();
  });

  test('const 声明再 export default 的组件包会递归解析子组件', () => {
    const pkgDir = path.join(tmpRoot, 'const-pkg');
    writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'const-pkg', main: 'index.js' }));
    writeFile(path.join(pkgDir, 'index.js'), "import foo from './foo';\nconst pkg = { foo };\nexport default pkg;\n");
    writeFile(path.join(pkgDir, 'foo/index.js'), "import Foo from './Foo';\nexport default Foo;\n");
    writeFile(path.join(pkgDir, 'foo/Foo.vue'), '<template></template>');

    const app = new Core({
      packages: [pkgDir],
      source: tmpRoot,
      temp: 'tmp',
      componentFileAffix: '.vue',
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage.foo).toBeTruthy();
  });

  test('组件包入口是文件时仍能解析相对路径子组件', () => {
    const pkgFile = path.join(tmpRoot, 'file-pkg.js');
    const fooDir = path.join(tmpRoot, 'foo-comp');
    writeFile(path.join(fooDir, 'index.js'), "import Foo from './Foo';\nexport default Foo;\n");
    writeFile(path.join(fooDir, 'Foo.vue'), '<template></template>');
    writeFile(pkgFile, "import foo from './foo-comp';\nexport default { foo };\n");

    const app = new Core({
      packages: [pkgFile],
      source: tmpRoot,
      temp: 'tmp',
      componentFileAffix: '.vue',
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage.foo).toBeTruthy();
  });

  test('npm 包名带版本号时会收集依赖；autoInstall 走安装命令', () => {
    const dest = path.join(tmpRoot, 'node_modules', 'remote-comp');
    const fakeNpm = path.join(tmpRoot, 'fake-npm.sh');
    writeFile(
      fakeNpm,
      [
        '#!/bin/sh',
        'set -e',
        `mkdir -p "${dest}"`,
        `printf '%s\\n' "import Foo from './Foo.js';" "export default Foo;" > "${dest}/index.js"`,
        `printf '%s\\n' "export default {};" > "${dest}/Foo.js"`,
        'exit 0',
        '',
      ].join('\n'),
    );
    fs.chmodSync(fakeNpm, 0o755);

    const app = new Core({
      packages: [{ 'remote-comp': 'remote-comp@1.2.3' }],
      source: tmpRoot,
      temp: 'tmp',
      npmConfig: { autoInstall: true, client: fakeNpm, registry: 'https://example.invalid', installArgs: '--omit=dev' },
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage['remote-comp']).toBeTruthy();
    expect(fs.existsSync(path.join(dest, 'index.js'))).toBe(true);
  });

  test('keepPackageJsonClean 时会备份并恢复 package.json', () => {
    writeFile(path.join(tmpRoot, 'package.json'), JSON.stringify({ name: 'app' }));
    const dest = path.join(tmpRoot, 'node_modules', 'clean-comp');
    const fakeNpm = path.join(tmpRoot, 'fake-npm.sh');
    writeFile(
      fakeNpm,
      [
        '#!/bin/sh',
        'set -e',
        `mkdir -p "${dest}"`,
        `printf '%s\\n' "import Foo from './Foo.js';" "export default Foo;" > "${dest}/index.js"`,
        `printf '%s\\n' "export default {};" > "${dest}/Foo.js"`,
        'exit 0',
        '',
      ].join('\n'),
    );
    fs.chmodSync(fakeNpm, 0o755);

    const app = new Core({
      packages: [{ 'clean-comp': 'clean-comp@2.0.0' }],
      source: tmpRoot,
      temp: 'tmp',
      npmConfig: { autoInstall: true, keepPackageJsonClean: true, client: fakeNpm },
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage['clean-comp']).toBeTruthy();
    expect(fs.existsSync(path.join(tmpRoot, 'package.json.bak'))).toBe(false);
  });

  test('npmInstall 失败时记录错误而不在安装阶段抛出', () => {
    const fakeNpm = path.join(tmpRoot, 'fake-npm-fail.sh');
    writeFile(fakeNpm, '#!/bin/sh\nexit 1\n');
    fs.chmodSync(fakeNpm, 0o755);

    const app = new Core({
      packages: [{ 'missing-remote': 'missing-remote@1.0.0' }],
      source: tmpRoot,
      temp: 'tmp',
      npmConfig: { autoInstall: true, client: fakeNpm },
    });

    // 安装失败被吞掉后，后续 resolve 仍会因模块不存在而失败
    expect(() => resolveAppPackages(app)).toThrow(/Cannot find module/);
  });

  test('npmInstall 以 argv 调用，不会把包名拼进 shell', () => {
    const argvLog = path.join(tmpRoot, 'npm-argv.json');
    const marker = path.join(tmpRoot, 'tmagic-cli-npm-pwn');
    const fakeNpm = path.join(tmpRoot, 'fake-npm-argv.sh');
    writeFile(fakeNpm, ['#!/bin/sh', `printf '%s\\n' "$@" > "${argvLog}"`, 'exit 0', ''].join('\n'));
    fs.chmodSync(fakeNpm, 0o755);

    const app = new Core({
      packages: [{ 'evil-comp': `evil-comp@1.0.0; touch ${marker}` }],
      source: tmpRoot,
      temp: 'tmp',
      npmConfig: { autoInstall: true, client: fakeNpm, installArgs: '--omit=dev' },
    });

    expect(() => resolveAppPackages(app)).toThrow(/Cannot find module/);
    expect(fs.existsSync(marker)).toBe(false);
    const argv = fs.readFileSync(argvLog, 'utf-8').trim().split('\n');
    expect(argv).toContain('--omit=dev');
    expect(argv.some((arg) => arg.includes('evil-comp@1.0.0; touch'))).toBe(true);
  });

  test('位于 node_modules 下的组件会裁剪 config/event 路径前缀', () => {
    const pkgDir = path.join(tmpRoot, 'node_modules', 'nm-comp');
    writeFile(
      path.join(pkgDir, 'index.js'),
      "import Foo from './Foo.js';\nexport { config } from './config.js';\nexport { event } from './event.js';\nexport { value } from './value.js';\nexport default Foo;\n",
    );
    writeFile(path.join(pkgDir, 'Foo.js'), 'export default {};\n');
    writeFile(path.join(pkgDir, 'config.js'), 'export default {};\n');
    writeFile(path.join(pkgDir, 'event.js'), 'export default {};\n');
    writeFile(path.join(pkgDir, 'value.js'), 'export default {};\n');

    const app = new Core({
      packages: [{ 'nm-comp': pkgDir }],
      source: tmpRoot,
      temp: 'tmp',
    });

    const result = resolveAppPackages(app);

    expect(result.configMap['nm-comp']).toBeTruthy();
    expect(result.eventMap['nm-comp']).toBeTruthy();
    expect(result.valueMap['nm-comp']).toBeTruthy();
  });

  test('没有 component 入口时回退到模块名', () => {
    const pkgDir = path.join(tmpRoot, 'plain-class');
    writeFile(path.join(pkgDir, 'index.js'), 'export default class Foo {}\n');

    const app = new Core({
      packages: [{ 'plain-class': pkgDir }],
      source: tmpRoot,
      temp: 'tmp',
    });

    const result = resolveAppPackages(app);

    expect(result.componentPackage['plain-class']).toBeTruthy();
    expect(result.componentMap['plain-class']).toBe(path.join(pkgDir, 'index.js'));
  });
});
