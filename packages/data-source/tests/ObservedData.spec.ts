/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';

import { DeepObservedData, SimpleObservedData } from '@data-source/observed-data';

describe('SimpleObservedData', () => {
  test('update / getData 全量与按路径', () => {
    const od = new SimpleObservedData({ a: 1, b: { c: 2 } });
    expect(od.getData('')).toEqual({ a: 1, b: { c: 2 } });
    expect(od.getData('b.c')).toBe(2);

    od.update({ a: 9 });
    expect(od.data.a).toBe(9);

    od.update(99, 'a');
    expect(od.data.a).toBe(99);
  });

  test('on / off 监听变更, immediate 立即触发一次', () => {
    const od = new SimpleObservedData({ a: 1 });
    const cb = vi.fn();
    od.on('a', cb, { immediate: true });
    expect(cb).toHaveBeenCalledTimes(1);
    od.update(2, 'a');
    expect(cb).toHaveBeenCalledTimes(2);

    od.off('a', cb);
    od.update(3, 'a');
    expect(cb).toHaveBeenCalledTimes(2);
  });

  test('全量更新触发空 path 监听器', () => {
    const od = new SimpleObservedData({ a: 1 });
    const cb = vi.fn();
    od.on('', cb);
    od.update({ a: 2 });
    expect(cb).toHaveBeenCalled();
  });

  test('destroy 不抛错', () => {
    const od = new SimpleObservedData({});
    expect(() => od.destroy()).not.toThrow();
  });
});

describe('DeepObservedData', () => {
  test('on/update/off/getData 完整链路', () => {
    const od = new DeepObservedData({ a: 1, list: [{ name: 'x' }] });

    const cb = vi.fn();
    od.on('a', cb);
    od.update(2, 'a');
    expect(cb).toHaveBeenCalled();
    expect(od.getData('a')).toBe(2);

    od.off('a', cb);
    cb.mockClear();
    od.update(3, 'a');
    expect(cb).not.toHaveBeenCalled();
  });

  test('immediate 选项立刻触发一次回调', () => {
    const od = new DeepObservedData({ a: 1 });
    const cb = vi.fn();
    od.on('a', cb, { immediate: true });
    expect(cb).toHaveBeenCalled();
  });

  test('off 不存在的 callback 不抛错', () => {
    const od = new DeepObservedData({ a: 1 });
    expect(() => od.off('a', () => undefined)).not.toThrow();
    expect(() => od.off('not-exist', () => undefined)).not.toThrow();
  });

  test('destroy 解除所有监听', () => {
    const od = new DeepObservedData({ a: 1 });
    const cb = vi.fn();
    od.on('a', cb);
    od.destroy();
    od.update(2, 'a');
    expect(cb).not.toHaveBeenCalled();
  });
});
