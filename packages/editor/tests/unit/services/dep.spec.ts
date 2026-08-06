/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { reactive } from 'vue';

import { createDataSourceTarget, DepTargetType, Target } from '@tmagic/core';

import depService from '@editor/services/dep';

// 全量收集（{ id, dsl }）与增量收集（{ id, payload }）共用一个常驻 worker
vi.mock('@editor/utils/dep/worker.ts?worker&inline', () => ({
  default: class FakeWorker {
    public static instances: FakeWorker[] = [];
    /** 全量收集返回的 deps */
    public static nextData: Record<string, any> = {};
    public static nextError = false;
    public static nextDelay = 0;
    /** 收到的全部请求（全量 + 增量），用于断言测例真正走到了 worker */
    public static requests: any[] = [];
    /** 增量收集返回的数据 */
    public static response: any = { deps: {}, nodeIds: [] };
    public static failed = false;
    public static delay = 0;

    public onmessage: ((e: any) => void) | null = null;
    public onerror: (() => void) | null = null;
    public onmessageerror: (() => void) | null = null;

    constructor() {
      FakeWorker.instances.push(this);
    }

    public postMessage(request: any) {
      FakeWorker.requests.push(request);

      if (!('dsl' in request)) {
        setTimeout(() => {
          this.onmessage?.({
            data: { id: request.id, failed: FakeWorker.failed, ...FakeWorker.response },
          });
        }, FakeWorker.delay);
        return;
      }

      setTimeout(() => {
        if (FakeWorker.nextError) {
          this.onerror?.();
          return;
        }
        this.onmessage?.({ data: { id: request.id, deps: FakeWorker.nextData } });
      }, FakeWorker.nextDelay);
    }

    public terminate() {}
  },
}));

const makeTarget = (id = 't1', type: string = DepTargetType.DEFAULT) =>
  new Target({
    id,
    type,
    isTarget: () => false,
  });

const getFakeWorker = async () => (await import('@editor/utils/dep/worker.ts?worker&inline')).default as any;

/** 环境不支持 Worker 时会走主线程 / 返回空结果，这里显式打开 worker 路径并重置 mock 状态 */
const enableCollectWorker = async () => {
  const fakeCollectWorker = await getFakeWorker();
  fakeCollectWorker.instances = [];
  fakeCollectWorker.requests = [];
  fakeCollectWorker.response = { deps: {}, nodeIds: [] };
  fakeCollectWorker.failed = false;
  fakeCollectWorker.delay = 0;
  fakeCollectWorker.nextData = {};
  fakeCollectWorker.nextError = false;
  fakeCollectWorker.nextDelay = 0;
  (globalThis as any).Worker = class {};
  return fakeCollectWorker;
};

beforeEach(async () => {
  depService.reset();
  // collectByWorker / collectIdle 共用常驻 CollectWorkerClient，happy-dom 默认没有 Worker
  await enableCollectWorker();
});

afterEach(() => {
  delete (globalThis as any).Worker;
  vi.clearAllMocks();
});

// Promise.withResolvers polyfill for older Node
if (typeof (Promise as any).withResolvers !== 'function') {
  (Promise as any).withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

describe('Dep service', () => {
  test('addTarget / getTarget / removeTarget', () => {
    const t = makeTarget('t1');
    depService.addTarget(t);
    expect(depService.getTarget('t1')).toBeDefined();
    expect(depService.hasTarget('t1')).toBe(true);
    depService.removeTarget('t1');
    expect(depService.getTarget('t1')).toBeUndefined();
  });

  test('addTarget 触发 add-target 事件', () => {
    const fn = vi.fn();
    depService.on('add-target', fn);
    const t = makeTarget('t2');
    depService.addTarget(t);
    expect(fn).toHaveBeenCalledWith(t);
    depService.off('add-target', fn);
  });

  test('removeTarget 触发 remove-target 事件', () => {
    const fn = vi.fn();
    const t = makeTarget('t3');
    depService.addTarget(t);
    depService.on('remove-target', fn);
    depService.removeTarget('t3');
    expect(fn).toHaveBeenCalledWith('t3', DepTargetType.DEFAULT);
    depService.off('remove-target', fn);
  });

  test('removeTargets 不抛错并清空目标', () => {
    depService.addTarget(makeTarget('a'));
    depService.addTarget(makeTarget('b'));
    expect(() => depService.removeTargets()).not.toThrow();
    expect(depService.getTarget('a')).toBeUndefined();
  });

  test('removeTargets - 不存在的 type 直接返回', () => {
    expect(() => depService.removeTargets('not-existing')).not.toThrow();
  });

  test('hasSpecifiedTypeTarget / clearTargets', () => {
    depService.addTarget(makeTarget('x'));
    expect(depService.hasSpecifiedTypeTarget()).toBe(true);
    depService.clearTargets();
    expect(depService.hasSpecifiedTypeTarget()).toBe(false);
  });

  test('set / get state', () => {
    depService.set('collecting', true);
    expect(depService.get('collecting')).toBe(true);
    depService.set('taskLength', 5);
    expect(depService.get('taskLength')).toBe(5);
  });

  test('collect 调用后触发 collected 事件', () => {
    const fn = vi.fn();
    depService.on('collected', fn);
    depService.collect([{ id: 'n1', type: 'text' }] as any);
    expect(fn).toHaveBeenCalled();
    expect(depService.get('collecting')).toBe(false);
    depService.off('collected', fn);
  });

  test('collectIdle - 没有命中时立即 resolve 并 emit collected', async () => {
    const fn = vi.fn();
    depService.on('collected', fn);
    await expect(depService.collectIdle([{ id: 'n1', type: 'text' }] as any)).resolves.toBe(true);
    expect(fn).toHaveBeenCalled();
    depService.off('collected', fn);
  });

  test('collectByWorker 完成后触发 collected 与 ds-collected', async () => {
    const fakeWorker = await enableCollectWorker();
    const fn = vi.fn();
    const dsFn = vi.fn();
    depService.on('collected', fn);
    depService.on('ds-collected', dsFn);
    await depService.collectByWorker({ items: [], id: 'app', type: 'app' } as any);
    // 必须真正 postMessage 到 worker，避免 isSupported=false 时假通过
    expect(fakeWorker.requests.some((request: any) => 'dsl' in request)).toBe(true);
    expect(fn).toHaveBeenCalled();
    expect(dsFn).toHaveBeenCalled();
    depService.off('collected', fn);
    depService.off('ds-collected', dsFn);
  });

  test('clear 与 clearByType', () => {
    expect(() => depService.clear()).not.toThrow();
    expect(() => depService.clearByType(DepTargetType.DEFAULT)).not.toThrow();
  });

  test('clearIdleTasks 安全调用', () => {
    expect(() => depService.clearIdleTasks()).not.toThrow();
  });

  test('reset 后 collecting=false 且 targets 清空', () => {
    depService.addTarget(makeTarget('rs'));
    depService.set('collecting', true);
    depService.reset();
    expect(depService.get('collecting')).toBe(false);
    expect(depService.hasTarget('rs')).toBe(false);
  });

  test('collect 在有 collectable target 时会收集依赖并触发 collected / ds-collected', () => {
    const collected = vi.fn();
    const dsCollected = vi.fn();
    depService.on('collected', collected);
    depService.on('ds-collected', dsCollected);
    depService.addTarget(makeTarget('t-collect'));
    depService.collect([{ id: 'n1', type: 'text' }] as any);
    expect(collected).toHaveBeenCalledWith([{ id: 'n1', type: 'text' }], false);
    expect(dsCollected).toHaveBeenCalled();
    depService.off('collected', collected);
    depService.off('ds-collected', dsCollected);
  });

  test('collect 对 page 节点会清理 page 级旧依赖', () => {
    depService.addTarget(makeTarget('page-target'));
    expect(() => depService.collect([{ id: 'p1', type: 'page', items: [] }] as any, { pageId: 'p1' })).not.toThrow();
  });

  test('collectNode 支持 page 与普通节点两条路径', () => {
    const target = makeTarget('node-target');
    depService.addTarget(target);
    depService.collectNode({ id: 'n1', type: 'text' } as any, target);
    depService.collectNode({ id: 'p1', type: 'page', items: [] } as any, target, { pageId: 'p1' });
    expect(depService.get('collecting')).toBe(false);
  });

  test('collectByWorker worker 报错时返回空对象并完成 collected', async () => {
    const fakeWorker = await enableCollectWorker();
    fakeWorker.nextError = true;
    const collected = vi.fn();
    depService.on('collected', collected);
    const result = await depService.collectByWorker({ items: [], id: 'app', type: 'app' } as any);
    expect(fakeWorker.requests.some((request: any) => 'dsl' in request)).toBe(true);
    expect(result).toEqual({});
    expect(collected).toHaveBeenCalled();
    depService.off('collected', collected);
  });

  test('collectByWorker 会把 worker 返回的 deps 写回 target 与 dsl', async () => {
    const fakeWorker = await enableCollectWorker();
    depService.addTarget(makeTarget('ds1', DepTargetType.DATA_SOURCE));
    depService.addTarget(makeTarget('cond1', DepTargetType.DATA_SOURCE_COND));
    depService.addTarget(makeTarget('method1', DepTargetType.DATA_SOURCE_METHOD));
    fakeWorker.nextData = {
      [DepTargetType.DATA_SOURCE]: { ds1: { fieldA: { data: {} } } },
      [DepTargetType.DATA_SOURCE_COND]: { cond1: { condA: { data: {} } } },
      [DepTargetType.DATA_SOURCE_METHOD]: { method1: { methodA: { data: {} } } },
    };
    const dsl: any = {
      items: [{ id: 'n1', type: 'text' }],
      id: 'app',
      type: 'app',
      dataSourceDeps: {},
      dataSourceCondDeps: {},
      dataSourceMethodDeps: {},
    };
    await depService.collectByWorker(dsl);
    expect(fakeWorker.requests.some((request: any) => 'dsl' in request)).toBe(true);
    expect(dsl.dataSourceDeps.ds1).toBeDefined();
    expect(dsl.dataSourceCondDeps.cond1).toBeDefined();
    expect(dsl.dataSourceMethodDeps.method1).toBeDefined();
  });

  test('collectIdle 命中 target 时最终 resolve 并按批次 emit collected/ds-collected', async () => {
    depService.addTarget(makeTarget('ds1', DepTargetType.DATA_SOURCE));
    const collected = vi.fn();
    const dsCollected = vi.fn();
    depService.on('collected', collected);
    depService.on('ds-collected', dsCollected);

    const nodes = [{ id: 'n1', type: 'text' }] as any;
    await expect(depService.collectIdle(nodes, {}, false, DepTargetType.DATA_SOURCE)).resolves.toBe(true);

    expect(dsCollected).toHaveBeenCalledWith(nodes, false);
    expect(collected).toHaveBeenCalledWith(nodes, false);
    expect(depService.get('collecting')).toBe(false);

    depService.off('collected', collected);
    depService.off('ds-collected', dsCollected);
  });

  test('clearIdleTasks 会结算在途 collectIdle，避免 Promise 永久挂起且 collecting 复位', async () => {
    depService.addTarget(makeTarget('ds1', DepTargetType.DATA_SOURCE));

    const promise = depService.collectIdle([{ id: 'n1', type: 'text' }] as any, {}, false, DepTargetType.DATA_SOURCE);
    expect(depService.get('collecting')).toBe(true);

    // 快速触发：任务尚未执行就清空队列，批次应被主动结算而不是永久挂起
    depService.clearIdleTasks();

    await expect(promise).resolves.toBe(false);
    expect(depService.get('collecting')).toBe(false);
  });

  test('reset 会结算在途 collectIdle', async () => {
    depService.addTarget(makeTarget('ds1', DepTargetType.DATA_SOURCE));

    const promise = depService.collectIdle([{ id: 'n1', type: 'text' }] as any, {}, false, DepTargetType.DATA_SOURCE);
    depService.reset();

    await expect(promise).resolves.toBe(false);
    expect(depService.get('collecting')).toBe(false);
  });

  test('reset 会忽略在途 worker 的过期结果，避免覆盖新依赖', async () => {
    const fakeWorker = (await import('@editor/utils/dep/worker.ts?worker&inline')).default as any;
    fakeWorker.nextDelay = 20;
    fakeWorker.nextData = {
      [DepTargetType.DATA_SOURCE]: { ds1: { n1: { data: {} } } },
    };

    const workerPromise = depService.collectByWorker({ items: [], id: 'app', type: 'app' } as any);
    depService.reset();

    const target = makeTarget('ds1', DepTargetType.DATA_SOURCE);
    depService.addTarget(target);
    const idlePromise = depService.collectIdle(
      [{ id: 'n1', type: 'text' }] as any,
      {},
      false,
      DepTargetType.DATA_SOURCE,
    );

    await Promise.all([workerPromise, idlePromise]);
    expect(target.deps.n1).toBeUndefined();

    fakeWorker.nextDelay = 0;
    fakeWorker.nextData = {};
  });

  test('多个批次并发时各自独立 resolve，全部完成后 collecting 复位', async () => {
    depService.addTarget(makeTarget('ds1', DepTargetType.DATA_SOURCE));

    const p1 = depService.collectIdle([{ id: 'n1', type: 'text' }] as any, {}, false, DepTargetType.DATA_SOURCE);
    const p2 = depService.collectIdle([{ id: 'n2', type: 'text' }] as any, {}, false, DepTargetType.DATA_SOURCE);

    await Promise.all([p1, p2]);
    expect(depService.get('collecting')).toBe(false);
  });

  test('target 收集抛错时批次仍会结算，collecting 与 taskLength 复位', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    depService.addTarget(
      new Target({
        id: 'throw-target',
        type: DepTargetType.DATA_SOURCE,
        isTarget: () => {
          throw new Error('boom');
        },
      }),
    );

    const nodes = Array.from({ length: 50 }, (_, i) => ({ id: `n${i}`, type: 'text', text: 'x' })) as any;
    await expect(depService.collectIdle(nodes, {}, false, DepTargetType.DATA_SOURCE)).resolves.toBe(true);

    expect(depService.get('collecting')).toBe(false);
    // taskLength 的更新做了 1s 节流，等节流窗口结束后才会同步到 0
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(depService.get('taskLength')).toBe(0);

    errorSpy.mockRestore();
  });

  test('collectIdle 优先用 worker 收集，主线程只把结果写回 target', async () => {
    const fakeCollectWorker = await enableCollectWorker();
    fakeCollectWorker.response = {
      deps: { [DepTargetType.DATA_SOURCE]: { ds_1: { n1: { name: 'n1', keys: ['text'] } } } },
      nodeIds: ['n1'],
    };

    const target = createDataSourceTarget({ id: 'ds_1', fields: [] }, reactive({}));
    depService.addTarget(target);
    // 旧依赖应被本次收集结果覆盖，而不是与之合并
    target.deps.n1 = { name: 'n1', keys: ['stale'] };

    const collected = vi.fn();
    const dsCollected = vi.fn();
    depService.on('collected', collected);
    depService.on('ds-collected', dsCollected);

    const nodes = [{ id: 'n1', type: 'text', text: '${ds_1.name}' }] as any;
    await expect(depService.collectIdle(nodes, {}, true, DepTargetType.DATA_SOURCE)).resolves.toBe(true);

    expect(fakeCollectWorker.requests).toHaveLength(1);
    // isTarget 无法跨线程传递，worker 中用 descriptor 重建 target
    expect(fakeCollectWorker.requests[0].payload).toContain('ds_1');
    expect(target.deps.n1.keys).toEqual(['text']);
    expect(dsCollected).toHaveBeenCalledWith(nodes, true);
    expect(collected).toHaveBeenCalledWith(nodes, true);
    expect(depService.get('collecting')).toBe(false);

    depService.off('collected', collected);
    depService.off('ds-collected', dsCollected);
  });

  test('collectIdle 会删除 worker 收集范围内节点的旧依赖', async () => {
    const fakeCollectWorker = await enableCollectWorker();
    fakeCollectWorker.response = { deps: {}, nodeIds: ['n1', 'n1_1'] };

    const target = createDataSourceTarget({ id: 'ds_1', fields: [] }, reactive({}));
    depService.addTarget(target);
    target.deps.n1 = { name: 'n1', keys: ['text'] };
    target.deps.n1_1 = { name: 'n1_1', keys: ['text'] };
    target.deps.other = { name: 'other', keys: ['text'] };

    await depService.collectIdle([{ id: 'n1', type: 'text' }] as any, {}, true, DepTargetType.DATA_SOURCE);

    expect(target.deps.n1).toBeUndefined();
    expect(target.deps.n1_1).toBeUndefined();
    // 不在本次收集范围内的节点依赖不受影响
    expect(target.deps.other).toBeDefined();
  });

  test('collectIdle 对 page 节点按 pageId 清理旧依赖', async () => {
    const fakeCollectWorker = await enableCollectWorker();
    fakeCollectWorker.response = { deps: {}, nodeIds: ['p1'] };

    const target = createDataSourceTarget({ id: 'ds_1', fields: [] }, reactive({}));
    depService.addTarget(target);
    // 已被删除的节点残留依赖，只能按 pageId 匹配清理
    target.deps.removed = { name: 'removed', keys: ['text'], data: { pageId: 'p1' } };
    target.deps.otherPage = { name: 'otherPage', keys: ['text'], data: { pageId: 'p2' } };

    await depService.collectIdle(
      [{ id: 'p1', type: 'page', items: [] }] as any,
      { pageId: 'p1' },
      true,
      DepTargetType.DATA_SOURCE,
    );

    expect(target.deps.removed).toBeUndefined();
    expect(target.deps.otherPage).toBeDefined();
  });

  test('worker 收集失败时回退到主线程收集，结果一致', async () => {
    const fakeCollectWorker = await enableCollectWorker();
    fakeCollectWorker.failed = true;

    const target = createDataSourceTarget({ id: 'ds_1', fields: [{ name: 'name', type: 'string' }] }, reactive({}));
    depService.addTarget(target);

    const nodes = [{ id: 'n1', type: 'text', text: '${ds_1.name}' }] as any;
    await expect(depService.collectIdle(nodes, {}, true, DepTargetType.DATA_SOURCE)).resolves.toBe(true);

    expect(target.deps.n1.keys).toEqual(['text']);
  });

  test('没有 descriptor 的自定义 target 仍在主线程收集', async () => {
    const fakeCollectWorker = await enableCollectWorker();

    const target = new Target({
      id: 'custom',
      type: DepTargetType.DEFAULT,
      isTarget: (key) => key === 'text',
    });
    depService.addTarget(target);

    await depService.collectIdle([{ id: 'n1', type: 'text', text: 'abc' }] as any);

    expect(fakeCollectWorker.requests).toHaveLength(0);
    expect(target.deps.n1.keys).toEqual(['text']);
  });

  test('批次被中断后不再写回 worker 结果', async () => {
    const fakeCollectWorker = await enableCollectWorker();
    fakeCollectWorker.delay = 20;
    fakeCollectWorker.response = {
      deps: { [DepTargetType.DATA_SOURCE]: { ds_1: { n1: { name: 'n1', keys: ['text'] } } } },
      nodeIds: ['n1'],
    };

    const target = createDataSourceTarget({ id: 'ds_1', fields: [] }, reactive({}));
    depService.addTarget(target);

    const promise = depService.collectIdle([{ id: 'n1', type: 'text' }] as any, {}, true, DepTargetType.DATA_SOURCE);
    depService.clearIdleTasks();

    await expect(promise).resolves.toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(target.deps.n1).toBeUndefined();
    expect(depService.get('collecting')).toBe(false);
  });

  test('collectIdle deep=false 不会清掉未参与重收的子孙依赖', async () => {
    const fakeCollectWorker = await enableCollectWorker();
    // worker 按 deep=false 只返回容器自身 id
    fakeCollectWorker.response = { deps: {}, nodeIds: ['container'] };

    const target = createDataSourceTarget({ id: 'ds_1', fields: [] }, reactive({}));
    depService.addTarget(target);
    target.deps.container = { name: 'container', keys: ['text'] };
    target.deps.child = { name: 'child', keys: ['text'] };

    await depService.collectIdle(
      [{ id: 'container', type: 'container', items: [{ id: 'child', type: 'text', text: '${ds_1.name}' }] }] as any,
      {},
      false,
      DepTargetType.DATA_SOURCE,
    );

    expect(target.deps.container).toBeUndefined();
    // 子孙未重收，旧依赖必须保留
    expect(target.deps.child).toBeDefined();
  });

  test('target 在 worker 收集期间被重建时丢弃过期结果并主线程补收', async () => {
    const fakeCollectWorker = await enableCollectWorker();
    fakeCollectWorker.response = {
      deps: { [DepTargetType.DATA_SOURCE]: { ds_1: { n1: { name: 'n1', keys: ['stale'] } } } },
      nodeIds: ['n1'],
    };

    depService.addTarget(
      createDataSourceTarget({ id: 'ds_1', fields: [{ name: 'name', type: 'string' }] }, reactive({})),
    );

    const promise = depService.collectIdle(
      [{ id: 'n1', type: 'text', text: '${ds_1.name}' }] as any,
      {},
      true,
      DepTargetType.DATA_SOURCE,
    );

    // 模拟修改数据源字段：target 被移除并重建
    depService.removeTarget('ds_1', DepTargetType.DATA_SOURCE);
    const newTarget = createDataSourceTarget({ id: 'ds_1', fields: [{ name: 'name', type: 'string' }] }, reactive({}));
    depService.addTarget(newTarget);

    await promise;

    // 过期的 stale 结果未写入；对新 target 主线程补收得到正确依赖
    expect(newTarget.deps.n1.keys).toEqual(['text']);
    expect(depService.get('collecting')).toBe(false);
  });

  test('clearIdleTasks 会丢弃在途 worker 结果，但不会销毁重建常驻 worker', async () => {
    const fakeCollectWorker = await enableCollectWorker();
    fakeCollectWorker.delay = 50;
    depService.addTarget(createDataSourceTarget({ id: 'ds_1', fields: [] }, reactive({})));

    const promise = depService.collectIdle([{ id: 'n1', type: 'text' }] as any, {}, true, DepTargetType.DATA_SOURCE);
    const instanceLength = fakeCollectWorker.instances.length;

    depService.clearIdleTasks();
    await expect(promise).resolves.toBe(false);

    // 中断只丢结果：worker 复用，避免「加载中被销毁 → 重建 → 又被销毁」的反复加载
    fakeCollectWorker.delay = 0;
    await depService.collectIdle([{ id: 'n2', type: 'text' }] as any, {}, true, DepTargetType.DATA_SOURCE);
    expect(fakeCollectWorker.instances.length).toBe(instanceLength);
  });

  test('root 反复更新时复用常驻 worker，不会重复创建', async () => {
    const fakeCollectWorker = await enableCollectWorker();
    const dsl = { id: 'app', type: 'app', items: [] } as any;

    depService.clearIdleTasks();
    await depService.collectByWorker(dsl);
    const instanceLength = fakeCollectWorker.instances.length;

    // root 更新流程：clearIdleTasks + 全量收集，多次更新应始终复用同一个 worker
    for (let i = 0; i < 3; i++) {
      depService.clearIdleTasks();
      await depService.collectByWorker(dsl);
    }

    expect(fakeCollectWorker.requests).toHaveLength(4);
    expect(fakeCollectWorker.instances.length).toBe(instanceLength);
  });

  test('大页面 + 连续 root/数据源变更：不反复创建 worker，最终收集可完成', async () => {
    const fakeCollectWorker = await enableCollectWorker();
    // 模拟大页面：worker 单次收集较慢，后续变更会打在「上一次还没结束」的窗口
    fakeCollectWorker.nextDelay = 80;
    fakeCollectWorker.delay = 80;
    fakeCollectWorker.nextData = {
      [DepTargetType.DATA_SOURCE]: { ds_1: { n1: { name: 'n1', keys: ['text'] } } },
    };
    fakeCollectWorker.response = {
      deps: { [DepTargetType.DATA_SOURCE]: { ds_1: { n1: { name: 'n1', keys: ['text'] } } } },
      nodeIds: ['n1'],
    };

    const dsl = {
      id: 'app',
      type: 'app',
      items: Array.from({ length: 200 }, (_, index) => ({ id: `n${index}`, type: 'text', text: '${ds_1.name}' })),
      dataSources: [{ id: 'ds_1', fields: [{ name: 'name', type: 'string' }] }],
      dataSourceDeps: {},
    } as any;

    depService.addTarget(
      createDataSourceTarget({ id: 'ds_1', fields: [{ name: 'name', type: 'string' }] }, reactive({})),
    );

    // 先暖机一次：depService 单例可能复用上个用例的 worker，以当前 instances 为基线
    await depService.collectByWorker(dsl);
    const instanceLength = fakeCollectWorker.instances.length;
    const requestLength = fakeCollectWorker.requests.length;

    const settled: boolean[] = [];
    // 首轮 root 全量收集尚未完成时，交错触发 root 更新与数据源重收
    const firstRoot = depService.collectByWorker(dsl).then(() => settled.push(true));
    const overlapping: Promise<unknown>[] = [];

    for (let i = 0; i < 8; i++) {
      depService.clearIdleTasks();
      overlapping.push(depService.collectByWorker(dsl).then(() => settled.push(true)));

      depService.clearIdleTasks();
      overlapping.push(
        depService
          .collectIdle(
            [{ id: `n${i}`, type: 'text', text: '${ds_1.name}' }] as any,
            {},
            true,
            DepTargetType.DATA_SOURCE,
          )
          .then((completed) => settled.push(completed)),
      );
    }

    await Promise.all([firstRoot, ...overlapping]);

    // 连续变更不应再 new Worker（instances 不增长）；请求有实际投递
    expect(fakeCollectWorker.instances.length).toBe(instanceLength);
    expect(fakeCollectWorker.requests.length).toBeGreaterThan(requestLength);
    // 最终至少有一轮完整收集完成；中间被 clearIdleTasks 打断的 idle 可能是 false
    expect(settled.some(Boolean)).toBe(true);
    expect(depService.get('collecting')).toBe(false);
  });

  test('collectIdle 节点为空时不会启动 worker', async () => {
    const fakeCollectWorker = await enableCollectWorker();
    depService.addTarget(createDataSourceTarget({ id: 'ds_1', fields: [] }, reactive({})));

    await expect(depService.collectIdle([], {}, true, DepTargetType.DATA_SOURCE)).resolves.toBe(true);

    expect(fakeCollectWorker.requests).toHaveLength(0);
  });

  test('destroy 会 reset 并移除监听', () => {
    depService.addTarget(makeTarget('destroy-me'));
    expect(() => depService.destroy()).not.toThrow();
    expect(depService.hasTarget('destroy-me')).toBe(false);
  });
});
