/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { cli } from '../src/cli';

describe('cli', () => {
  let tmpRoot: string;
  let originalArgv: string[];

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-cli-'));
    originalArgv = process.argv;
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    process.argv = originalArgv;
    delete require.extensions['.ts'];
    vi.restoreAllMocks();
  });

  test('调用后注册了 .ts 扩展并能解析 --version 参数', () => {
    process.argv = ['node', 'tmagic', '--version'];

    expect(() =>
      cli({
        packages: [],
        source: tmpRoot,
        temp: 'tmp',
      }),
    ).not.toThrow();

    expect(typeof require.extensions['.ts']).toBe('function');
  });

  test('未指定子命令时不会触发 entry 动作', () => {
    process.argv = ['node', 'tmagic'];

    expect(() =>
      cli({
        packages: [],
        source: tmpRoot,
        temp: 'tmp',
      }),
    ).not.toThrow();
  });
});
