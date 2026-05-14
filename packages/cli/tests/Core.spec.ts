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
import { ModuleMainFilePath, UserConfig } from '../src/types';

const emptyModuleMap: ModuleMainFilePath = {
  componentPackage: {},
  componentMap: {},
  pluginPakcage: {},
  pluginMap: {},
  configMap: {},
  valueMap: {},
  eventMap: {},
  datasourcePackage: {},
  datasourceMap: {},
  dsConfigMap: {},
  dsValueMap: {},
  dsEventMap: {},
};

/**
 * prepareEntryFile 内部调用 writeTemp 后未 await 异步写入，
 * 这里通过轮询等待文件落盘后再断言。
 */
const waitForFile = async (filePath: string, timeoutMs = 2000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(filePath)) return true;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return false;
};

describe('Core', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-core-'));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  test('实例化后基本字段齐备', () => {
    const core = new Core({ packages: [], source: './a', temp: './b' });
    expect(core).toBeInstanceOf(Core);
    expect(typeof core.version).toBe('string');
    expect(core.options.source).toBe('./a');
    expect(core.moduleMainFilePath.componentMap).toEqual({});
  });

  test('dir.temp() 解析为 source/temp 的绝对路径', () => {
    const core = new Core({ packages: [], source: './a', temp: './b' });
    expect(core.dir.temp()).toBe(path.join(process.cwd(), './a/b'));
  });

  test('writeTemp 会按 temp 目录写入文件', async () => {
    const core = new Core({ packages: [], source: tmpRoot, temp: 'tmp-out' });
    await core.writeTemp('hello.txt', 'world');
    const target = path.join(tmpRoot, 'tmp-out', 'hello.txt');
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readFileSync(target, 'utf-8')).toBe('world');
  });

  test('init 在没有 packages 时使用默认的 resolveAppPackages 结果', async () => {
    const core = new Core({ packages: [], source: tmpRoot, temp: 'tmp' });
    await core.init();
    expect(core.moduleMainFilePath).toMatchObject({
      componentPackage: {},
      componentMap: {},
      datasourcePackage: {},
    });
  });

  test('init 优先使用 onInit 钩子覆写 moduleMainFilePath', async () => {
    const onInit = vi.fn().mockResolvedValue({
      ...emptyModuleMap,
      componentMap: { foo: 'bar' },
    });
    const options: UserConfig = {
      packages: [],
      source: tmpRoot,
      temp: 'tmp',
      onInit,
    };
    const core = new Core(options);
    await core.init();

    expect(onInit).toHaveBeenCalledWith(core);
    expect(core.moduleMainFilePath.componentMap).toEqual({ foo: 'bar' });
  });

  test('prepare 会写出 entry 文件，并触发 onPrepare 钩子', async () => {
    const onPrepare = vi.fn();
    const core = new Core({
      packages: [],
      source: tmpRoot,
      temp: 'tmp-entry',
      useTs: true,
      onPrepare,
    });

    await core.prepare();

    const tempDir = path.join(tmpRoot, 'tmp-entry');
    expect(await waitForFile(path.join(tempDir, 'comp-entry.ts'))).toBe(true);
    expect(await waitForFile(path.join(tempDir, 'plugin-entry.ts'))).toBe(true);
    expect(await waitForFile(path.join(tempDir, 'datasource-entry.ts'))).toBe(true);
    expect(onPrepare).toHaveBeenCalledWith(core);
  });

  test('prepare 在 useTs=false 时同时输出 .js 与 .d.ts', async () => {
    const core = new Core({
      packages: [],
      source: tmpRoot,
      temp: 'tmp-js',
      useTs: false,
    });

    await core.prepare();

    const tempDir = path.join(tmpRoot, 'tmp-js');
    expect(await waitForFile(path.join(tempDir, 'comp-entry.js'))).toBe(true);
    expect(await waitForFile(path.join(tempDir, 'comp-entry.d.ts'))).toBe(true);
  });
});
