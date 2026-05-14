/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { allowTs, transformTsFileToCodeSync } from '../src/utils/allowTs';

describe('allowTs', () => {
  let tmpRoot: string;
  let tsFile: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-allowts-'));
    tsFile = path.join(tmpRoot, 'sample.ts');
    fs.writeFileSync(
      tsFile,
      `export const greet = (name: string): string => \`hi \${name}\`;\nexport default greet;\n`,
    );
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    delete require.extensions['.ts'];
  });

  test('transformTsFileToCodeSync 输出 cjs 代码并保留逻辑', () => {
    const code = transformTsFileToCodeSync(tsFile);
    expect(code).toContain('exports');
    expect(code).toContain('greet');
    expect(code).toContain('hi');
  });

  test('allowTs 注册 .ts loader 后，require 可以加载 ts 文件', () => {
    allowTs();
    expect(typeof require.extensions['.ts']).toBe('function');

    delete require.cache[tsFile];
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(tsFile);
    const greet = mod.default ?? mod.greet;
    expect(greet('world')).toBe('hi world');
  });
});
