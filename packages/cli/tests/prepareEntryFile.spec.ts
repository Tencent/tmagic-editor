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
import { EntryType } from '../src/types';
import { generateContent, makeCamelCase, prepareEntryFile, prettyCode } from '../src/utils/prepareEntryFile';

/**
 * prepareEntryFile 内部的 writeTemp 是浮动 Promise，并且会对同一文件多次写入。
 * 这里轮询直到文件内容包含期望子串再断言，避免读到中间状态的空文件。
 */
const waitForContent = async (filePath: string, expected: string, timeoutMs = 2000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes(expected)) return content;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
};

describe('makeCamelCase', () => {
  test('短横线分隔的字符串转为驼峰', () => {
    expect(makeCamelCase('foo-bar-baz')).toBe('fooBarBaz');
    expect(makeCamelCase('foo')).toBe('foo');
    expect(makeCamelCase('a-b-c-d')).toBe('aBCD');
  });

  test('非字符串返回空字符串', () => {
    expect(makeCamelCase(123 as unknown as string)).toBe('');
    expect(makeCamelCase(null as unknown as string)).toBe('');
    expect(makeCamelCase(undefined as unknown as string)).toBe('');
  });
});

describe('prettyCode', () => {
  test('转换反斜杠并美化代码', () => {
    const out = prettyCode("const x: Record<string, any> = { 'a\\b': 1 };\nexport default x;");
    expect(out).toContain("'a/b'");
    expect(out).toContain('export default');
  });
});

describe('generateContent', () => {
  test('使用默认参数生成空对象的入口文件', () => {
    const code = generateContent(true, EntryType.COMPONENT);
    expect(code).toContain('const components: Record<string, any>');
    expect(code).toContain('export default components');
  });

  test('为组件 / 插件 / 数据源生成 default import', () => {
    const code = generateContent(
      true,
      EntryType.COMPONENT,
      { 'foo-bar': 'foo-bar-pkg' },
      { 'foo-bar': './foo-bar/index' },
    );
    expect(code).toContain("import fooBar from './foo-bar/index'");
    expect(code).toContain("'foo-bar': fooBar");
  });

  test('config / value / event 类型并且 packagePath 与 packageMap 一致时使用具名导入', () => {
    const code = generateContent(true, EntryType.CONFIG, { 'foo-bar': './pkg' }, { 'foo-bar': './pkg' });
    expect(code).toContain("import { config as fooBar } from './pkg'");
    expect(code).toContain("'foo-bar': fooBar");
  });

  test('dynamicImport 启用时使用 import() 语法', () => {
    const code = generateContent(true, EntryType.COMPONENT, { foo: './foo' }, { foo: './foo/index' }, true);
    expect(code).toContain("'foo': () => import('./foo/index')");
  });

  test('dynamicIgnore 中的 key 不走 dynamicImport', () => {
    const code = generateContent(
      true,
      EntryType.COMPONENT,
      { foo: './foo', bar: './bar' },
      { foo: './foo/index', bar: './bar/index' },
      true,
      ['foo'],
    );
    expect(code).toContain("import foo from './foo/index'");
    expect(code).toContain("'foo': foo");
    expect(code).toContain("'bar': () => import('./bar/index')");
  });

  test('useTs=false 时不会添加类型注解', () => {
    const code = generateContent(false, EntryType.COMPONENT, { foo: './foo' }, { foo: './foo' });
    expect(code).not.toContain('Record<string, any>');
    expect(code).toContain('const components');
  });
});

describe('prepareEntryFile', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-prep-'));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  test('beforeWriteEntry 钩子可以改写最终写入的内容', async () => {
    const beforeWriteEntry = vi.fn(async (map: Record<string, string>) => ({
      ...map,
      'comp-entry': '// custom comp entry\n',
    }));

    const core = new Core({
      packages: [],
      source: tmpRoot,
      temp: 'tmp',
      useTs: true,
      hooks: { beforeWriteEntry },
    });

    await prepareEntryFile(core);

    expect(beforeWriteEntry).toHaveBeenCalled();

    const compEntry = path.join(tmpRoot, 'tmp', 'comp-entry.ts');
    const content = await waitForContent(compEntry, 'custom comp entry');
    expect(content).toContain('custom comp entry');
  });
});
