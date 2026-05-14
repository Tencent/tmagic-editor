/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { DepTargetType } from '@tmagic/core';

const postedMessages: any[] = [];

beforeEach(() => {
  postedMessages.length = 0;
  vi.resetModules();
  Object.defineProperty(globalThis, 'postMessage', {
    value: (msg: any) => postedMessages.push(msg),
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  // 还原可能被覆盖的 onmessage
  (globalThis as any).onmessage = undefined;
});

const loadWorker = () => import('@editor/utils/dep/worker');

describe('dep/worker', () => {
  test('注册 onmessage 处理器', async () => {
    await loadWorker();
    expect(typeof (globalThis as any).onmessage).toBe('function');
  });

  test('正常 dsl - 收集 codeBlocks/dataSources/items 并 postMessage', async () => {
    await loadWorker();
    const dsl = JSON.stringify({
      id: 'app',
      type: 'app',
      codeBlocks: { cb_1: { name: 'fn1', content: 'function (){}' } },
      dataSources: [{ id: 'ds_1', type: 'base', fields: [] }],
      items: [{ id: 'page_1', type: 'page', items: [] }],
    });
    (globalThis as any).onmessage({ data: { dsl } });
    expect(postedMessages).toHaveLength(1);
    const data = postedMessages[0];
    expect(data).toHaveProperty(DepTargetType.DATA_SOURCE);
    expect(data).toHaveProperty(DepTargetType.CODE_BLOCK);
  });

  test('eval dsl 抛错时 postMessage({})', async () => {
    await loadWorker();
    (globalThis as any).onmessage({ data: { dsl: '!@#invalid' } });
    expect(postedMessages[0]).toEqual({});
  });

  test('mApp 为空时也会调用 postMessage', async () => {
    await loadWorker();
    (globalThis as any).onmessage({ data: { dsl: 'null' } });
    expect(postedMessages.length).toBeGreaterThanOrEqual(1);
  });

  test('mApp 没有 codeBlocks/dataSources 时也能完成', async () => {
    await loadWorker();
    const dsl = JSON.stringify({ id: 'app', type: 'app', items: [] });
    (globalThis as any).onmessage({ data: { dsl } });
    expect(postedMessages).toHaveLength(1);
  });
});
