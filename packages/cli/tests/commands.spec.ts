/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { scripts } from '../src/commands';
import Core from '../src/Core';
import { allowTs } from '../src/utils/allowTs';

const writeFile = (file: string, content: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

describe('scripts (entry 命令)', () => {
  let tmpRoot: string;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-cmd-'));
    originalNodeEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    allowTs();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    delete require.extensions['.ts'];
    vi.restoreAllMocks();
  });

  test('未指定 NODE_ENV 时默认设为 development，并返回初始化好的 App', async () => {
    const entry = scripts({
      packages: [],
      source: tmpRoot,
      temp: 'tmp',
    });

    const app = await entry();

    expect(process.env.NODE_ENV).toBe('development');
    expect(app).toBeInstanceOf(Core);
    expect(app.options.source).toBe(tmpRoot);
  });

  test('cleanTemp=true 时会清空 temp 目录', async () => {
    const tempDir = path.join(tmpRoot, 'tmp');
    writeFile(path.join(tempDir, 'old.txt'), 'should be deleted');

    const entry = scripts({
      packages: [],
      source: tmpRoot,
      temp: 'tmp',
      cleanTemp: true,
    });

    await entry();

    expect(fs.existsSync(path.join(tempDir, 'old.txt'))).toBe(false);
  });

  test('能够读取 source 下的 tmagic.config.js 并合并到默认配置中', async () => {
    writeFile(path.join(tmpRoot, 'tmagic.config.js'), 'module.exports = { useTs: false, packages: [] };\n');

    const entry = scripts({
      packages: [],
      source: tmpRoot,
      temp: 'tmp',
      useTs: true,
    });

    const app = await entry();

    expect(app.options.useTs).toBe(false);
  });

  test('local 配置文件会覆盖普通配置，并且 packages 会被合并', async () => {
    writeFile(path.join(tmpRoot, 'tmagic.config.js'), "module.exports = { useTs: false, packages: ['foo'] };\n");
    writeFile(path.join(tmpRoot, 'tmagic.config.local.js'), "module.exports = { useTs: true, packages: ['bar'] };\n");

    const entry = scripts({
      packages: [],
      source: tmpRoot,
      temp: 'tmp',
    });

    // packages 中的 'foo' 与 'bar' 都不是真实的 npm 包，
    // 由于配置在合并后会触发 resolveAppPackages 解析，这里我们 mock 掉 init
    // 以便仅校验配置合并行为。
    const initSpy = vi.spyOn(Core.prototype, 'init').mockResolvedValue(undefined);
    const prepareSpy = vi.spyOn(Core.prototype, 'prepare').mockResolvedValue(undefined);

    const app = await entry();

    expect(initSpy).toHaveBeenCalled();
    expect(prepareSpy).toHaveBeenCalled();
    expect(app.options.useTs).toBe(true);
    expect(app.options.packages).toEqual(['foo', 'bar']);
  });
});
