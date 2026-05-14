/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import storage, { Protocol } from '@editor/services/storage';
import { setEditorConfig } from '@editor/utils/config';

describe('storage service', () => {
  beforeEach(() => {
    storage.clear();
    // eslint-disable-next-line no-eval
    setEditorConfig({ parseDSL: (s: string) => eval(s) } as any);
  });

  afterEach(() => {
    storage.clear();
  });

  test('setItem / getItem 字符串', () => {
    storage.setItem('k', 'v');
    expect(storage.getItem('k')).toBe('v');
  });

  test('setItem / getItem 数字', () => {
    storage.setItem('n', 1, { protocol: Protocol.NUMBER });
    expect(storage.getItem('n')).toBe(1);
  });

  test('setItem / getItem boolean', () => {
    storage.setItem('b', true, { protocol: Protocol.BOOLEAN });
    expect(storage.getItem('b')).toBe(true);
    storage.setItem('b2', false, { protocol: Protocol.BOOLEAN });
    expect(storage.getItem('b2')).toBe(false);
  });

  test('setItem / getItem JSON', () => {
    storage.setItem('j', { a: 1 }, { protocol: Protocol.JSON });
    expect(storage.getItem('j')).toEqual({ a: 1 });
  });

  test('setItem / getItem object 走 parseDSL', () => {
    storage.setItem('o', { a: 1 }, { protocol: Protocol.OBJECT });
    expect(storage.getItem('o')).toEqual({ a: 1 });
  });

  test('removeItem 删除项', () => {
    storage.setItem('r', 'v');
    storage.removeItem('r');
    expect(storage.getItem('r')).toBeNull();
  });

  test('自定义 namespace', () => {
    storage.setItem('k', 'v', { namespace: 'custom' });
    expect(storage.getItem('k', { namespace: 'custom' })).toBe('v');
    expect(storage.getItem('k')).toBeNull();
  });

  test('getStorage / getNamespace', () => {
    expect(storage.getStorage()).toBe(globalThis.localStorage);
    expect(storage.getNamespace()).toBe('tmagic');
  });

  test('key 接口', () => {
    storage.setItem('a', 'a');
    expect(typeof storage.key(0)).toBe('string');
  });

  test('getItem 不存在的 key 返回 null', () => {
    expect(storage.getItem('not-exist')).toBeNull();
  });
});
