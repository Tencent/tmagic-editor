/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { DepTargetType } from '@tmagic/core';

import { CollectWorkerClient } from '@editor/utils/dep/collect-worker-client';

vi.mock('@editor/utils/dep/worker.ts?worker&inline', () => ({
  default: class FakeCollectWorker {
    public static instances: FakeCollectWorker[] = [];
    /** 收到的请求 */
    public static requests: any[] = [];
    public static response: any = { deps: {}, nodeIds: [] };
    /** worker 内部执行失败 */
    public static failed = false;
    /** worker 整体异常 */
    public static fatal = false;
    /** 构造时抛错 */
    public static throwOnCreate = false;
    /** postMessage 抛错，如结构化克隆失败 */
    public static throwOnPost = false;

    public onmessage: ((e: any) => void) | null = null;
    public onerror: (() => void) | null = null;
    public onmessageerror: (() => void) | null = null;
    public terminated = false;

    constructor() {
      if (FakeCollectWorker.throwOnCreate) {
        throw new Error('create failed');
      }
      FakeCollectWorker.instances.push(this);
    }

    public postMessage(request: any) {
      if (FakeCollectWorker.throwOnPost) {
        throw new Error('post failed');
      }

      FakeCollectWorker.requests.push(request);

      setTimeout(() => {
        if (FakeCollectWorker.fatal) {
          this.onerror?.();
          return;
        }

        this.onmessage?.({
          data: { id: request.id, failed: FakeCollectWorker.failed, ...FakeCollectWorker.response },
        });
      });
    }

    public terminate() {
      this.terminated = true;
    }
  },
}));

const getFakeWorker = async () => (await import('@editor/utils/dep/worker.ts?worker&inline')).default as any;

const payload = {
  nodes: [{ id: 'text_1', type: 'text' }] as any,
  targets: [{ type: DepTargetType.DATA_SOURCE, ds: { id: 'ds_1', fields: [] } }] as any,
  depExtendedData: {},
  deep: false,
};

const dsl = { id: 'app', type: 'app', items: [{ id: 'text_1', type: 'text' }] } as any;

beforeEach(async () => {
  const fakeCollectWorker = await getFakeWorker();
  fakeCollectWorker.instances = [];
  fakeCollectWorker.requests = [];
  fakeCollectWorker.response = { deps: {}, nodeIds: [] };
  fakeCollectWorker.failed = false;
  fakeCollectWorker.fatal = false;
  fakeCollectWorker.throwOnCreate = false;
  fakeCollectWorker.throwOnPost = false;

  (globalThis as any).Worker = class {};
});

afterAll(() => {
  delete (globalThis as any).Worker;
});

describe('dep/collect-worker-client', () => {
  test('环境不支持 Worker 时返回 null，由调用方回退主线程收集', async () => {
    delete (globalThis as any).Worker;
    const client = new CollectWorkerClient();

    expect(client.isSupported).toBe(false);
    await expect(client.collect(payload)).resolves.toBeNull();
  });

  test('收集结果按请求 id 返回', async () => {
    const fakeCollectWorker = await getFakeWorker();
    fakeCollectWorker.response = {
      deps: { [DepTargetType.DATA_SOURCE]: { ds_1: { text_1: { name: 'text', keys: ['text'] } } } },
      nodeIds: ['text_1'],
    };

    const client = new CollectWorkerClient();
    const result = await client.collect(payload);

    expect(result?.nodeIds).toEqual(['text_1']);
    expect(result?.deps[DepTargetType.DATA_SOURCE].ds_1).toEqual({ text_1: { name: 'text', keys: ['text'] } });
    // 节点配置可能存在无法结构化克隆的值，需要先序列化
    expect(typeof fakeCollectWorker.requests[0].payload).toBe('string');
  });

  test('collectDsl 全量收集返回 deps', async () => {
    const fakeCollectWorker = await getFakeWorker();
    fakeCollectWorker.response = {
      deps: { [DepTargetType.DATA_SOURCE]: { ds_1: { text_1: { name: 'text', keys: ['text'] } } } },
    };

    const client = new CollectWorkerClient();
    const deps = await client.collectDsl(dsl);

    expect(deps?.[DepTargetType.DATA_SOURCE].ds_1).toEqual({ text_1: { name: 'text', keys: ['text'] } });
    expect(typeof fakeCollectWorker.requests[0].dsl).toBe('string');
  });

  test('collectDsl 执行失败时返回 null', async () => {
    const fakeCollectWorker = await getFakeWorker();
    fakeCollectWorker.failed = true;

    const client = new CollectWorkerClient();

    await expect(client.collectDsl(dsl)).resolves.toBeNull();
  });

  test('全量与增量收集共用一个常驻 worker，各请求按 id 对应结果', async () => {
    const fakeCollectWorker = await getFakeWorker();
    const client = new CollectWorkerClient();

    await Promise.all([client.collectDsl(dsl), client.collect(payload), client.collect(payload)]);

    expect(fakeCollectWorker.instances).toHaveLength(1);
    expect(fakeCollectWorker.requests.map((request: any) => request.id)).toEqual([1, 2, 3]);
    expect(fakeCollectWorker.requests.map((request: any) => 'dsl' in request)).toEqual([true, false, false]);
  });

  test('worker 执行失败时返回 null', async () => {
    const fakeCollectWorker = await getFakeWorker();
    fakeCollectWorker.failed = true;

    const client = new CollectWorkerClient();

    await expect(client.collect(payload)).resolves.toBeNull();
  });

  test('worker 整体异常时结算所有在途请求并重建 worker', async () => {
    const fakeCollectWorker = await getFakeWorker();
    fakeCollectWorker.fatal = true;

    const client = new CollectWorkerClient();
    const results = await Promise.all([client.collect(payload), client.collect(payload)]);

    expect(results).toEqual([null, null]);
    expect(fakeCollectWorker.instances[0].terminated).toBe(true);

    // 异常后重建 worker，后续收集仍可用
    fakeCollectWorker.fatal = false;
    await expect(client.collect(payload)).resolves.not.toBeNull();
    expect(fakeCollectWorker.instances).toHaveLength(2);
  });

  test('onmessageerror 同样结算在途请求', async () => {
    const fakeCollectWorker = await getFakeWorker();
    const client = new CollectWorkerClient();

    const promise = client.collect(payload);
    fakeCollectWorker.instances[0].onmessageerror?.();

    await expect(promise).resolves.toBeNull();
  });

  test('worker 创建失败时返回 null', async () => {
    const fakeCollectWorker = await getFakeWorker();
    fakeCollectWorker.throwOnCreate = true;

    const client = new CollectWorkerClient();

    await expect(client.collect(payload)).resolves.toBeNull();
  });

  test('postMessage 抛错时返回 null', async () => {
    const fakeCollectWorker = await getFakeWorker();
    fakeCollectWorker.throwOnPost = true;

    const client = new CollectWorkerClient();

    await expect(client.collect(payload)).resolves.toBeNull();
  });

  test('响应缺少字段时按空结果处理', async () => {
    const fakeCollectWorker = await getFakeWorker();
    const client = new CollectWorkerClient();

    const promise = client.collect(payload);
    fakeCollectWorker.instances[0].onmessage?.({ data: { id: 1 } });

    await expect(promise).resolves.toEqual({ deps: {}, nodeIds: [] });
  });

  test('非法响应被忽略', async () => {
    const fakeCollectWorker = await getFakeWorker();
    const client = new CollectWorkerClient();

    const promise = client.collect(payload);
    expect(() => fakeCollectWorker.instances[0].onmessage?.({ data: undefined })).not.toThrow();

    await expect(promise).resolves.not.toBeNull();
  });

  test('未知请求 id 的响应被忽略', async () => {
    const fakeCollectWorker = await getFakeWorker();
    const client = new CollectWorkerClient();

    const promise = client.collect(payload);
    fakeCollectWorker.instances[0].onmessage?.({ data: { id: 999, deps: {}, nodeIds: [] } });

    await expect(promise).resolves.not.toBeNull();
  });

  test('terminate 结算在途请求并销毁 worker', async () => {
    const fakeCollectWorker = await getFakeWorker();
    const client = new CollectWorkerClient();

    const promise = client.collect(payload);
    client.terminate();

    await expect(promise).resolves.toBeNull();
    expect(fakeCollectWorker.instances[0].terminated).toBe(true);
  });

  test('abort 与 terminate 一样丢弃在途请求，后续收集会重建 worker', async () => {
    const fakeCollectWorker = await getFakeWorker();
    const client = new CollectWorkerClient();

    const promise = client.collect(payload);
    client.abort();

    await expect(promise).resolves.toBeNull();
    expect(fakeCollectWorker.instances[0].terminated).toBe(true);

    await expect(client.collect(payload)).resolves.not.toBeNull();
    expect(fakeCollectWorker.instances).toHaveLength(2);
  });
});
