/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { IdleTask } from '@editor/utils/dep/idle-task';

const fakeIdleDeadline = (timeRemaining: number, callsBeforeZero = 1): IdleDeadline => {
  let remainingCalls = callsBeforeZero;
  return {
    didTimeout: false,
    timeRemaining: () => {
      if (remainingCalls <= 0) return 0;
      remainingCalls -= 1;
      return timeRemaining;
    },
  };
};

describe('IdleTask', () => {
  let originalRic: any;
  let originalCancel: any;
  let scheduled: { cb: IdleRequestCallback; opts?: IdleRequestOptions }[] = [];
  let idCounter = 0;

  beforeEach(() => {
    scheduled = [];
    idCounter = 0;
    originalRic = globalThis.requestIdleCallback;
    originalCancel = globalThis.cancelIdleCallback;
    globalThis.requestIdleCallback = ((cb: IdleRequestCallback, opts?: IdleRequestOptions) => {
      scheduled.push({ cb, opts });
      idCounter += 1;
      return idCounter;
    }) as any;
    globalThis.cancelIdleCallback = vi.fn();
  });

  afterEach(() => {
    globalThis.requestIdleCallback = originalRic;
    globalThis.cancelIdleCallback = originalCancel;
  });

  test('入队普通任务后调度 requestIdleCallback', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    task.enqueueTask(handler, 1);
    expect(scheduled).toHaveLength(1);
  });

  test('继续入队同优先级任务不会重复调度', () => {
    const task = new IdleTask<number>();
    task.enqueueTask(() => undefined, 1);
    task.enqueueTask(() => undefined, 2);
    expect(scheduled).toHaveLength(1);
  });

  test('runTaskQueue - 高优先级任务优先执行', () => {
    const task = new IdleTask<string>();
    const order: string[] = [];
    task.enqueueTask(() => order.push('low'), 'low');
    task.enqueueTask(() => order.push('high'), 'high', true);

    scheduled[0].cb(fakeIdleDeadline(20));
    expect(order[0]).toBe('high');
    expect(order[1]).toBe('low');
  });

  test('剩余空闲时间 <=5 时单批最多 10 个任务', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 1000; i++) task.enqueueTask(handler, i);

    scheduled[0].cb(fakeIdleDeadline(3, 1));
    expect(handler.mock.calls.length).toBeGreaterThan(0);
    expect(handler.mock.calls.length).toBeLessThanOrEqual(10);
  });

  test('剩余时间 8（5-10 范围）单批最多 100', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 1000; i++) task.enqueueTask(handler, i);
    scheduled[0].cb(fakeIdleDeadline(8, 1));
    expect(handler.mock.calls.length).toBeLessThanOrEqual(100);
  });

  test('剩余时间 12 单批最多 300', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 1000; i++) task.enqueueTask(handler, i);
    scheduled[0].cb(fakeIdleDeadline(12, 1));
    expect(handler.mock.calls.length).toBeLessThanOrEqual(300);
  });

  test('剩余时间 50 单批最多 600', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 1000; i++) task.enqueueTask(handler, i);
    scheduled[0].cb(fakeIdleDeadline(50, 1));
    expect(handler.mock.calls.length).toBeLessThanOrEqual(600);
  });

  test('完成所有任务后触发 finish 与 hight-level-finish 事件', () => {
    const task = new IdleTask<number>();
    const finishHandler = vi.fn();
    const hlFinishHandler = vi.fn();
    const updateHandler = vi.fn();
    task.on('finish', finishHandler);
    task.on('hight-level-finish', hlFinishHandler);
    task.on('update-task-length', updateHandler);

    task.enqueueTask(() => undefined, 1);
    scheduled[0].cb(fakeIdleDeadline(50));

    expect(finishHandler).toHaveBeenCalled();
    expect(hlFinishHandler).toHaveBeenCalled();
    expect(updateHandler).toHaveBeenCalled();
  });

  test('剩余任务时再次调度 requestIdleCallback', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 200; i++) task.enqueueTask(handler, i);
    scheduled[0].cb(fakeIdleDeadline(3, 1));
    expect(scheduled.length).toBeGreaterThan(1);
  });

  test('clearTasks - 取消挂起任务并重置队列', () => {
    const task = new IdleTask<number>();
    task.enqueueTask(() => undefined, 1);
    task.clearTasks();
    expect(globalThis.cancelIdleCallback).toHaveBeenCalled();
  });

  test('clearTasks 在没有挂起任务时也安全', () => {
    const task = new IdleTask<number>();
    expect(() => task.clearTasks()).not.toThrow();
  });

  test('once 监听器执行一次后失效', () => {
    const task = new IdleTask<number>();
    const fn = vi.fn();
    task.once('finish', fn);
    task.emit('finish');
    task.emit('finish');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('全局 requestIdleCallback polyfill 在浏览器无原生时降级到 setTimeout', () => {
    vi.useFakeTimers();
    const original = globalThis.requestIdleCallback;
    delete (globalThis as any).requestIdleCallback;
    // 重新加载模块以触发 polyfill 注册
    vi.resetModules();
    return import('@editor/utils/dep/idle-task').then(() => {
      expect(typeof globalThis.requestIdleCallback).toBe('function');
      const cb = vi.fn();
      const id = globalThis.requestIdleCallback(cb);
      expect(id).toBeDefined();
      vi.runAllTimers();
      expect(cb).toHaveBeenCalled();
      vi.useRealTimers();
      globalThis.requestIdleCallback = original;
    });
  });
});
