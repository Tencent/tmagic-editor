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
});
