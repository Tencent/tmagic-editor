/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';

import BaseService from '@editor/services/BaseService';

class SyncService extends BaseService {
  public count = 0;
  constructor() {
    super([{ name: 'add', isAsync: false }]);
  }
  public add(value: number): number {
    this.count += value;
    return this.count;
  }
}

class AsyncService extends BaseService {
  public count = 0;
  constructor(serial = false) {
    super([{ name: 'add', isAsync: true }], serial ? ['add'] : []);
  }
  public async add(value: number): Promise<number> {
    await Promise.resolve();
    this.count += value;
    return this.count;
  }
}

describe('BaseService 同步方法 + plugin', () => {
  test('beforeAdd / afterAdd 正常被链式调用', () => {
    const svc = new SyncService();
    const before = vi.fn((v: number) => [v + 1]);
    const after = vi.fn((result: number) => result * 10);
    svc.usePlugin({ beforeAdd: before, afterAdd: after });

    const result = svc.add(2);
    expect(before).toHaveBeenCalledWith(2);
    expect(after).toHaveBeenCalled();
    expect(result).toBe(30);
  });

  test('use 添加同步 middleware', () => {
    const svc = new SyncService();
    const order: string[] = [];
    svc.use({
      add(_value: number, next: Function) {
        order.push('mw-before');
        next();
        order.push('mw-after');
      },
    });
    svc.add(1);
    expect(order).toEqual(['mw-before', 'mw-after']);
  });

  test('removePlugin 解除指定钩子', () => {
    const svc = new SyncService();
    const before = vi.fn((v: number) => [v]);
    svc.usePlugin({ beforeAdd: before });
    svc.removePlugin({ beforeAdd: before });
    svc.add(1);
    expect(before).not.toHaveBeenCalled();
  });

  test('removeAllPlugins 清空所有 plugin/middleware', () => {
    const svc = new SyncService();
    const before = vi.fn((v: number) => [v]);
    svc.usePlugin({ beforeAdd: before });
    svc.removeAllPlugins();
    svc.add(1);
    expect(before).not.toHaveBeenCalled();
  });

  test('before 返回 Error 抛错终止', () => {
    const svc = new SyncService();
    svc.usePlugin({
      beforeAdd: () => new Error('stop'),
    });
    expect(() => svc.add(1)).toThrow('stop');
  });
});

describe('BaseService 异步方法', () => {
  test('beforeAdd / afterAdd 异步链路', async () => {
    const svc = new AsyncService();
    svc.usePlugin({
      beforeAdd: async (v: number) => [v + 1],
      afterAdd: async (r: number) => r + 100,
    });
    const result = await svc.add(1);
    expect(result).toBe(102);
  });

  test('serial 模式按顺序执行', async () => {
    const svc = new AsyncService(true);
    const results = await Promise.all([svc.add(1), svc.add(2), svc.add(3)]);
    expect(results).toEqual([1, 3, 6]);
  });

  test('before 返回非数组时被包装为数组', async () => {
    const svc = new AsyncService();
    svc.usePlugin({ beforeAdd: async (v: number) => v + 5 });
    const result = await svc.add(1);
    expect(result).toBe(6);
  });

  test('after 返回 Error 抛错', async () => {
    const svc = new AsyncService();
    svc.usePlugin({ afterAdd: async () => new Error('after-bad') });
    await expect(svc.add(1)).rejects.toThrow('after-bad');
  });
});
