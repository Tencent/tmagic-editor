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
    /** 模拟大页面收集耗时 */
    public static delay = 0;

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
      }, FakeCollectWorker.delay);
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
  fakeCollectWorker.delay = 0;

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

  test('abort 丢弃在途请求，但保留常驻 worker（不重建、不重复加载）', async () => {
    const fakeCollectWorker = await getFakeWorker();
    const client = new CollectWorkerClient();

    const promise = client.collect(payload);
    client.abort();

    // 在途请求按 null 结算，调用方回退主线程收集
    await expect(promise).resolves.toBeNull();
    expect(fakeCollectWorker.instances[0].terminated).toBe(false);

    // worker 复用，不会因为 abort 重建
    await expect(client.collect(payload)).resolves.not.toBeNull();
    expect(fakeCollectWorker.instances).toHaveLength(1);
  });

  test('被 abort 丢弃的请求结果不会回传，且不阻塞后续请求', async () => {
    const fakeCollectWorker = await getFakeWorker();
    const client = new CollectWorkerClient();
    const settled: unknown[] = [];

    const aborted = client.collect(payload).then((result) => settled.push(result));
    client.abort();
    // abort 后紧接着的新请求（如 root 更新触发的全量收集）排在被丢弃请求之后，仍能拿到结果
    const next = client.collectDsl(dsl);

    await Promise.all([aborted, next]);

    expect(settled).toEqual([null]);
    await expect(next).resolves.not.toBeNull();
    expect(fakeCollectWorker.instances).toHaveLength(1);
  });

  test('无在途请求时 abort 保留常驻 worker，不会反复加载 worker 产物', async () => {
    const fakeCollectWorker = await getFakeWorker();
    const client = new CollectWorkerClient();

    await client.collectDsl(dsl);
    expect(fakeCollectWorker.instances).toHaveLength(1);

    // 模拟 root 更新：clearIdleTasks 先 abort，紧接着发起全量收集
    client.abort();
    await client.collectDsl(dsl);

    expect(fakeCollectWorker.instances).toHaveLength(1);
    expect(fakeCollectWorker.instances[0].terminated).toBe(false);
  });

  test('大页面长耗时 + 连续 abort/收集：不重建 worker，最终请求仍能完成', async () => {
    const fakeCollectWorker = await getFakeWorker();
    // 模拟大页面收集耗时；连续 abort 落在「上一次还没跑完」的窗口内
    fakeCollectWorker.delay = 80;
    const client = new CollectWorkerClient();
    const results: Array<unknown> = [];

    // 首轮投递后，在 worker 忙时连续模拟 root 更新：abort + 新全量收集
    const first = client.collectDsl(dsl).then((result) => results.push(result));
    const overlapping: Promise<unknown>[] = [];
    for (let i = 0; i < 12; i++) {
      client.abort();
      overlapping.push(client.collectDsl(dsl).then((result) => results.push(result)));
    }

    const all = await Promise.all([first, ...overlapping]);

    // 不应陷入「加载中被销毁 → 重建」：始终只有 1 个 worker 实例
    expect(fakeCollectWorker.instances).toHaveLength(1);
    expect(fakeCollectWorker.instances[0].terminated).toBe(false);
    // 被 abort 的立即 null；最后一次保留的请求能拿到结果
    expect(results.filter((item) => item === null).length).toBeGreaterThan(0);
    expect(all[all.length - 1]).not.toBeNull();
    // discarded 长任务仍占 worker：真正投递给 worker 的次数远少于发起次数
    expect(fakeCollectWorker.requests.length).toBeLessThan(all.length);
    expect(fakeCollectWorker.requests.length).toBeGreaterThanOrEqual(1);
  });

  test('abort 后新请求要等 discarded 长任务结束才能投递', async () => {
    const fakeCollectWorker = await getFakeWorker();
    fakeCollectWorker.delay = 60;
    const client = new CollectWorkerClient();

    const first = client.collectDsl(dsl);
    client.abort();
    const next = client.collectDsl(dsl);

    // abort 后立刻结算旧请求，但新请求尚未投递（仍被 discarded inflight 堵住）
    await expect(first).resolves.toBeNull();
    expect(fakeCollectWorker.requests).toHaveLength(1);

    await expect(next).resolves.not.toBeNull();
    expect(fakeCollectWorker.requests).toHaveLength(2);
    expect(fakeCollectWorker.instances).toHaveLength(1);
  });
});
