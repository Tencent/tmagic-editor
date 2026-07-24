/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { DepTargetType, Target } from '@tmagic/core';

import depService from '@editor/services/dep';

vi.mock('@editor/utils/dep/worker.ts?worker&inline', () => ({
  default: class FakeWorker {
    public static nextData: Record<string, any> = {};
    public static nextError = false;
    public static nextDelay = 0;
    public onmessage: ((e: any) => void) | null = null;
    public onerror: (() => void) | null = null;
    public postMessage() {
      setTimeout(() => {
        if (FakeWorker.nextError) {
          this.onerror?.();
          return;
        }
        this.onmessage?.({ data: FakeWorker.nextData });
      }, FakeWorker.nextDelay);
    }
  },
}));

const makeTarget = (id = 't1', type: string = DepTargetType.DEFAULT) =>
  new Target({
    id,
    type,
    isTarget: () => false,
  });

beforeEach(() => {
  depService.reset();
});

afterEach(() => {
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
    const fn = vi.fn();
    const dsFn = vi.fn();
    depService.on('collected', fn);
    depService.on('ds-collected', dsFn);
    await depService.collectByWorker({ items: [], id: 'app', type: 'app' } as any);
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
    const fakeWorker = (await import('@editor/utils/dep/worker.ts?worker&inline')).default as any;
    fakeWorker.nextError = true;
    fakeWorker.nextData = {};
    const collected = vi.fn();
    depService.on('collected', collected);
    const result = await depService.collectByWorker({ items: [], id: 'app', type: 'app' } as any);
    expect(result).toEqual({});
    expect(collected).toHaveBeenCalled();
    fakeWorker.nextError = false;
    depService.off('collected', collected);
  });

  test('collectByWorker 会把 worker 返回的 deps 写回 target 与 dsl', async () => {
    const fakeWorker = (await import('@editor/utils/dep/worker.ts?worker&inline')).default as any;
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
    expect(dsl.dataSourceDeps.ds1).toBeDefined();
    expect(dsl.dataSourceCondDeps.cond1).toBeDefined();
    expect(dsl.dataSourceMethodDeps.method1).toBeDefined();
    fakeWorker.nextData = {};
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

  test('destroy 会 reset 并移除监听', () => {
    depService.addTarget(makeTarget('destroy-me'));
    expect(() => depService.destroy()).not.toThrow();
    expect(depService.hasTarget('destroy-me')).toBe(false);
  });
});
