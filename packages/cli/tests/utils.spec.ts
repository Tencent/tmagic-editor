/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  backupFile,
  backupLock,
  backupNpmLock,
  backupPackageJson,
  backupPnpmLock,
  backupYarnLock,
  isRootPath,
  restoreFile,
  restoreLock,
  restoreNpmLock,
  restorePackageJson,
  restorePnpmLock,
  restoreYarnLock,
} from '../src/utils/backupPackageFile';
import { defineConfig } from '../src/utils/defineUserConfig';
import { hasExportDefault, isPlainObject, loadUserConfig } from '../src/utils/loadUserConfig';
import * as logger from '../src/utils/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('info / error / success / execInfo 都会调用 console.log', () => {
    logger.info('a');
    logger.error('b');
    logger.success('c');
    logger.execInfo('d');
    expect((console.log as any).mock.calls.length).toBe(4);
  });
});

describe('isRootPath', () => {
  test('非字符串输入抛错', () => {
    expect(() => isRootPath(123 as any)).toThrow(TypeError);
  });

  test('空字符串与超长字符串返回 false', () => {
    expect(isRootPath('')).toBe(false);
    expect(isRootPath('x'.repeat(101))).toBe(false);
  });

  test('Linux 根路径返回 true', () => {
    if (process.platform !== 'win32') {
      expect(isRootPath('/')).toBe(true);
      expect(isRootPath('/foo')).toBe(false);
    }
  });

  test('两侧空白会被裁剪', () => {
    if (process.platform !== 'win32') {
      expect(isRootPath('  /  ')).toBe(true);
    }
  });
});

describe('backupFile / restoreFile - 根路径短路', () => {
  test('isRootPath 为 true 时 backupFile 与 restoreFile 直接返回', () => {
    if (process.platform === 'win32') return;
    // 不应抛错也不应有副作用
    expect(() => backupFile('/', 'package.json')).not.toThrow();
    expect(() => restoreFile('/', 'package.json')).not.toThrow();
  });
});

describe('backupFile / restoreFile 流程', () => {
  let tmpRoot: string;
  let nested: string;
  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-bk-'));
    nested = path.join(tmpRoot, 'nested');
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'package.json'), '{}');
  });
  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('在嵌套目录中向上递归找到目标后备份', () => {
    backupFile(nested, 'package.json');
    expect(fs.existsSync(path.join(tmpRoot, 'package.json.bak'))).toBe(true);
  });

  test('restore 回滚备份', () => {
    backupFile(nested, 'package.json');
    fs.writeFileSync(path.join(tmpRoot, 'package.json'), '{"changed":true}');
    restoreFile(nested, 'package.json');
    const restored = JSON.parse(fs.readFileSync(path.join(tmpRoot, 'package.json'), 'utf-8'));
    expect(restored).toEqual({});
  });

  test('便利函数全部能调用', () => {
    fs.writeFileSync(path.join(tmpRoot, 'pnpm-lock.yaml'), '');
    fs.writeFileSync(path.join(tmpRoot, 'yarn-lock.json'), '');
    fs.writeFileSync(path.join(tmpRoot, 'package-lock.json'), '');
    backupPnpmLock(tmpRoot);
    backupYarnLock(tmpRoot);
    backupNpmLock(tmpRoot);
    backupPackageJson(tmpRoot);
    expect(fs.existsSync(path.join(tmpRoot, 'pnpm-lock.yaml.bak'))).toBe(true);
    expect(fs.existsSync(path.join(tmpRoot, 'yarn-lock.json.bak'))).toBe(true);
    expect(fs.existsSync(path.join(tmpRoot, 'package-lock.json.bak'))).toBe(true);
    expect(fs.existsSync(path.join(tmpRoot, 'package.json.bak'))).toBe(true);

    restorePnpmLock(tmpRoot);
    restoreYarnLock(tmpRoot);
    restoreNpmLock(tmpRoot);
    restorePackageJson(tmpRoot);
  });

  test('backupLock / restoreLock 走对应 npm 类型', () => {
    fs.writeFileSync(path.join(tmpRoot, 'pnpm-lock.yaml'), '');
    backupLock(tmpRoot, 'pnpm');
    expect(fs.existsSync(path.join(tmpRoot, 'pnpm-lock.yaml.bak'))).toBe(true);
    restoreLock(tmpRoot, 'pnpm');

    fs.writeFileSync(path.join(tmpRoot, 'yarn-lock.json'), '');
    backupLock(tmpRoot, 'yarn');
    expect(fs.existsSync(path.join(tmpRoot, 'yarn-lock.json.bak'))).toBe(true);
    restoreLock(tmpRoot, 'yarn');

    fs.writeFileSync(path.join(tmpRoot, 'package-lock.json'), '');
    backupLock(tmpRoot, 'npm');
    expect(fs.existsSync(path.join(tmpRoot, 'package-lock.json.bak'))).toBe(true);
    restoreLock(tmpRoot, 'npm');

    backupLock(tmpRoot, 'unknown');
    restoreLock(tmpRoot, 'unknown');
  });
});

describe('defineConfig', () => {
  test('原样返回输入', () => {
    const cfg = { source: '.', temp: 'tmp', packages: [] };
    expect(defineConfig(cfg as any)).toBe(cfg);
  });
});

describe('loadUserConfig 与 isPlainObject / hasExportDefault', () => {
  test('isPlainObject', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject('s')).toBe(false);
  });

  test('hasExportDefault 仅识别 __esModule + default', () => {
    expect(hasExportDefault({ __esModule: true, default: 1 })).toBe(true);
    expect(hasExportDefault({ default: 1 })).toBe(false);
    expect(hasExportDefault({ __esModule: true })).toBe(false);
    expect(hasExportDefault('x')).toBe(false);
  });

  test('loadUserConfig - 没有 path 时返回 {}', async () => {
    expect(await loadUserConfig()).toEqual({});
    expect(await loadUserConfig('')).toEqual({});
  });

  test('loadUserConfig - 不匹配的扩展名返回 {}', async () => {
    expect(await loadUserConfig('/path/file.json')).toEqual({});
  });

  test('loadUserConfig - 加载真实 .js 配置文件 (CommonJS 默认导出)', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-cfg-'));
    const cfg = path.join(tmp, 'cfg.js');
    fs.writeFileSync(cfg, "module.exports = { source: '.', temp: 'tmp', packages: [], useTs: true };\n");
    try {
      const config = await loadUserConfig(cfg);
      expect(config).toMatchObject({ useTs: true, packages: [] });
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('loadUserConfig - 加载 ESM-style __esModule + default 配置', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-cfg-esm-'));
    const cfg = path.join(tmp, 'cfg.js');
    fs.writeFileSync(
      cfg,
      "Object.defineProperty(exports, '__esModule', { value: true });\n" +
        "exports.default = { source: '.', temp: 'tmp', packages: [], useTs: false };\n",
    );
    try {
      const config = await loadUserConfig(cfg);
      expect(config).toMatchObject({ useTs: false });
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
