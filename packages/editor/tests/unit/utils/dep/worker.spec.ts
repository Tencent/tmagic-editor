/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import serialize from 'serialize-javascript';

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

/** 全量收集：worker 中根据 dsl 重建 target */
const postDslRequest = (dsl: string, id = 1) => {
  (globalThis as any).onmessage({ data: { id, dsl } });
  return postedMessages[0];
};

/** 增量收集：target 由主线程以可序列化描述传入 */
const postCollectRequest = (payload: any, id = 1) => {
  (globalThis as any).onmessage({ data: { id, payload: typeof payload === 'string' ? payload : serialize(payload) } });
  return postedMessages[0];
};

describe('dep/worker', () => {
  test('注册 onmessage 处理器', async () => {
    await loadWorker();
    expect(typeof (globalThis as any).onmessage).toBe('function');
  });

  test('正常 dsl - 收集 codeBlocks/dataSources/items 并 postMessage', async () => {
    await loadWorker();
    const response = postDslRequest(
      JSON.stringify({
        id: 'app',
        type: 'app',
        codeBlocks: { cb_1: { name: 'fn1', content: 'function (){}' } },
        dataSources: [{ id: 'ds_1', type: 'base', fields: [] }],
        items: [{ id: 'page_1', type: 'page', items: [] }],
      }),
    );
    expect(postedMessages).toHaveLength(1);
    // 全量与增量收集共用一个 worker，响应必须带上请求 id
    expect(response.id).toBe(1);
    expect(response.deps).toHaveProperty(DepTargetType.DATA_SOURCE);
    expect(response.deps).toHaveProperty(DepTargetType.CODE_BLOCK);
  });

  test('eval dsl 抛错时返回 failed', async () => {
    await loadWorker();
    expect(postDslRequest('!@#invalid')).toEqual({ id: 1, deps: {}, failed: true });
  });

  test('mApp 为空时只返回一次空结果', async () => {
    await loadWorker();
    expect(postDslRequest('null')).toEqual({ id: 1, deps: {} });
    expect(postedMessages).toHaveLength(1);
  });

  test('mApp 没有 codeBlocks/dataSources 时也能完成', async () => {
    await loadWorker();
    expect(postDslRequest(JSON.stringify({ id: 'app', type: 'app', items: [] })).deps).toBeDefined();
    expect(postedMessages).toHaveLength(1);
  });

  test('增量收集 - 收集数据源依赖并返回覆盖到的节点 id', async () => {
    await loadWorker();

    const response = postCollectRequest({
      nodes: [
        {
          id: 'page_1',
          type: 'page',
          items: [{ id: 'text_1', type: 'text', text: '${ds_1.name}' }],
        },
      ],
      targets: [{ type: DepTargetType.DATA_SOURCE, ds: { id: 'ds_1', fields: [{ name: 'name', type: 'string' }] } }],
      depExtendedData: { pageId: 'page_1' },
      deep: true,
    });

    expect(response.id).toBe(1);
    expect(response.failed).toBeUndefined();
    expect(response.deps[DepTargetType.DATA_SOURCE].ds_1.text_1.keys).toEqual(['text']);
    expect(response.deps[DepTargetType.DATA_SOURCE].ds_1.text_1.data).toEqual({ pageId: 'page_1' });
    // 主线程据此删除旧依赖，必须包含子孙节点
    expect(response.nodeIds).toEqual(['page_1', 'text_1']);
  });

  test('增量收集 - deep 为 false 时不收集子节点依赖，也不返回子节点 id', async () => {
    await loadWorker();

    const response = postCollectRequest({
      nodes: [
        {
          id: 'page_1',
          type: 'page',
          items: [{ id: 'text_1', type: 'text', text: '${ds_1.name}' }],
        },
      ],
      targets: [{ type: DepTargetType.DATA_SOURCE, ds: { id: 'ds_1', fields: [{ name: 'name', type: 'string' }] } }],
      depExtendedData: {},
      deep: false,
    });

    expect(response.deps[DepTargetType.DATA_SOURCE].ds_1).toEqual({});
    // deep=false 时 nodeIds 不能含子孙，否则写回会误清子节点依赖
    expect(response.nodeIds).toEqual(['page_1']);
  });

  test('增量收集 - 支持代码块 target', async () => {
    await loadWorker();

    const response = postCollectRequest({
      nodes: [{ id: 'text_1', type: 'text', created: 'code_1' }],
      targets: [{ type: DepTargetType.CODE_BLOCK, id: 'code_1', codeBlock: { name: 'fn' } }],
      depExtendedData: {},
      deep: false,
    });

    expect(response.deps[DepTargetType.CODE_BLOCK].code_1.text_1.keys).toEqual(['created']);
  });

  test('增量收集 - 多个 target 一次收集，结果按 type/id 分组', async () => {
    await loadWorker();

    const response = postCollectRequest({
      nodes: [{ id: 'text_1', type: 'text', created: 'code_1', text: '${ds_1.name}' }],
      targets: [
        { type: DepTargetType.CODE_BLOCK, id: 'code_1', codeBlock: { name: 'fn' } },
        { type: DepTargetType.DATA_SOURCE, ds: { id: 'ds_1', fields: [{ name: 'name', type: 'string' }] } },
        { type: DepTargetType.DATA_SOURCE_COND, ds: { id: 'ds_1', fields: [{ name: 'name', type: 'string' }] } },
        { type: DepTargetType.DATA_SOURCE_METHOD, ds: { id: 'ds_1', fields: [], methods: [] } },
      ],
      depExtendedData: {},
      deep: false,
    });

    expect(Object.keys(response.deps).sort()).toEqual(
      [
        DepTargetType.CODE_BLOCK,
        DepTargetType.DATA_SOURCE,
        DepTargetType.DATA_SOURCE_COND,
        DepTargetType.DATA_SOURCE_METHOD,
      ].sort(),
    );
  });

  test('增量收集 - payload 非法时返回 failed，调用方据此回退主线程收集', async () => {
    await loadWorker();

    expect(postCollectRequest('!@#invalid')).toEqual({ id: 1, deps: {}, nodeIds: [], failed: true });
  });

  test('增量收集 - target 描述非法时返回 failed', async () => {
    await loadWorker();

    const response = postCollectRequest({
      nodes: [{ id: 'text_1', type: 'text' }],
      targets: [{ type: 'unknown-type' }],
      depExtendedData: {},
      deep: false,
    });

    expect(response.failed).toBe(true);
  });
});
