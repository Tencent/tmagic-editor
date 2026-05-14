/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';

import { compose } from '@editor/utils/compose';

describe('compose 同步', () => {
  test('依次调用 middleware 并通过 next 串行', () => {
    const order: number[] = [];
    const m1 = (next: Function) => {
      order.push(1);
      next();
      order.push(4);
    };
    const m2 = (next: Function) => {
      order.push(2);
      next();
      order.push(3);
    };
    compose([m1, m2], false)([]);
    expect(order).toEqual([1, 2, 3, 4]);
  });

  test('next() 多次调用抛错', () => {
    const m = (next: Function) => {
      next();
      next();
    };
    expect(() => compose([m], false)([])).toThrow(/next\(\) 被多次调用/);
  });

  test('参数 fn 不是函数抛错', () => {
    expect(() => compose([null as any], false)([])).toThrow(/Middleware 必须由函数组成/);
  });

  test('参数不是数组抛错', () => {
    expect(() => compose('x' as any, false)([])).toThrow(/Middleware 必须是一个数组/);
  });

  test('支持 next 参数透传', () => {
    const order: number[] = [];
    const tail = () => order.push(99);
    compose(
      [
        (next: Function) => {
          order.push(1);
          next();
        },
      ],
      false,
    )([], tail);
    expect(order).toEqual([1, 99]);
  });
});

describe('compose 异步', () => {
  test('返回 Promise，按 next 顺序执行', async () => {
    const order: number[] = [];
    const m1 = async (next: Function) => {
      order.push(1);
      await next();
      order.push(4);
    };
    const m2 = async (next: Function) => {
      order.push(2);
      await next();
      order.push(3);
    };
    await compose([m1, m2], true)([]);
    expect(order).toEqual([1, 2, 3, 4]);
  });

  test('next 多次调用 reject', async () => {
    const m = async (next: Function) => {
      await next();
      await next();
    };
    await expect(compose([m], true)([])).rejects.toBeInstanceOf(Error);
  });

  test('middleware 抛同步错时 reject', async () => {
    const m = () => {
      throw new Error('boom');
    };
    await expect(compose([m as any], true)([])).rejects.toThrow('boom');
  });
});
