/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { IdleTask } from '@editor/utils/dep/idle-task';
import * as logger from '@editor/utils/logger';

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

/**
 * 主线程一直没有空闲时浏览器的真实行为：回调因 timeout 触发，
 * didTimeout 为 true 且 timeRemaining() 恒为 0
 */
const timedOutIdleDeadline = (): IdleDeadline => ({
  didTimeout: true,
  timeRemaining: () => 0,
});

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
    vi.useRealTimers();
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

  // callsBeforeZero 需为 2：第一次读取用于 while 判断，第二次读取才是决定单批任务数的值
  test('剩余空闲时间 <=5 时单批 10 个任务', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 1000; i++) task.enqueueTask(handler, i);

    scheduled[0].cb(fakeIdleDeadline(3, 2));
    expect(handler.mock.calls.length).toBe(10);
  });

  test('剩余时间 8（5-10 范围）单批 100', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 1000; i++) task.enqueueTask(handler, i);
    scheduled[0].cb(fakeIdleDeadline(8, 2));
    expect(handler.mock.calls.length).toBe(100);
  });

  test('剩余时间 12（10-15 范围）单批 300', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 1000; i++) task.enqueueTask(handler, i);
    scheduled[0].cb(fakeIdleDeadline(12, 2));
    expect(handler.mock.calls.length).toBe(300);
  });

  test('剩余时间 50（>15）单批 600', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 1000; i++) task.enqueueTask(handler, i);
    scheduled[0].cb(fakeIdleDeadline(50, 2));
    expect(handler.mock.calls.length).toBe(600);
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

  test('单个任务抛错不会中断整个队列', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const task = new IdleTask<number>();
    const done: number[] = [];
    const finishHandler = vi.fn();
    task.on('finish', finishHandler);

    for (let i = 0; i < 10; i++) {
      task.enqueueTask((n) => {
        if (n === 3) throw new Error('boom');
        done.push(n);
      }, i);
    }

    expect(() => scheduled[0].cb(fakeIdleDeadline(50))).not.toThrow();
    expect(done).toEqual([0, 1, 2, 4, 5, 6, 7, 8, 9]);
    expect(finishHandler).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('任务抛错且仍有剩余任务时继续调度下一轮并同步任务数', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const task = new IdleTask<number>();
    const updateHandler = vi.fn();
    task.on('update-task-length', updateHandler);

    for (let i = 0; i < 200; i++) {
      task.enqueueTask((n) => {
        if (n === 0) throw new Error('boom');
      }, i);
    }

    // 单批最多执行 10 个，执行完仍有剩余任务
    scheduled[0].cb(fakeIdleDeadline(3, 1));

    expect(scheduled.length).toBeGreaterThan(1);
    expect(updateHandler).toHaveBeenCalledWith({ length: 190, hightLevelLength: 0 });
    errorSpy.mockRestore();
  });

  test('任务执行过程中 clearTasks 会立即停止消费已清空的队列', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn((n: number) => {
      if (n === 0) {
        task.clearTasks();
      }
    });
    for (let i = 0; i < 200; i++) task.enqueueTask(handler, i);

    scheduled[0].cb(fakeIdleDeadline(50));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('任务执行过程中清空并重新入队，新任务仍会被执行', () => {
    const task = new IdleTask<number>();
    const afterHandler = vi.fn();
    task.enqueueTask((n) => {
      if (n === 0) {
        task.clearTasks();
        task.enqueueTask(afterHandler, 999);
      }
    }, 0);
    for (let i = 1; i < 200; i++) task.enqueueTask(() => undefined, i);

    scheduled[0].cb(fakeIdleDeadline(50));

    expect(afterHandler).toHaveBeenCalled();
  });

  test('因 timeout 触发（无空闲时间）时任务仍会被执行，队列不会永久停滞', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 5; i++) task.enqueueTask(handler, i);

    scheduled[0].cb(timedOutIdleDeadline());

    expect(handler).toHaveBeenCalledTimes(5);
    expect(scheduled).toHaveLength(1);
  });

  test('因 timeout 触发时受时间预算约束，不会一次跑完巨大队列阻塞主线程', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 1000; i++) task.enqueueTask(handler, i);

    // 每读一次时钟推进 3ms：预算 5ms 时最多跑两批
    let now = 0;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
      now += 3;
      return now;
    });

    scheduled[0].cb(timedOutIdleDeadline());
    nowSpy.mockRestore();

    expect(handler.mock.calls.length).toBe(20);
  });

  test('因 timeout 触发且仍有剩余任务时继续调度下一轮', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn();
    for (let i = 0; i < 1000; i++) task.enqueueTask(handler, i);

    let now = 0;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
      now += 10;
      return now;
    });

    scheduled[0].cb(timedOutIdleDeadline());
    nowSpy.mockRestore();

    expect(scheduled.length).toBeGreaterThan(1);
    expect(handler.mock.calls.length).toBeLessThan(1000);
  });

  test('因 timeout 触发时高优先级任务仍优先执行', () => {
    const task = new IdleTask<string>();
    const order: string[] = [];
    task.enqueueTask(() => order.push('low'), 'low');
    task.enqueueTask(() => order.push('high'), 'high', true);

    scheduled[0].cb(timedOutIdleDeadline());

    expect(order).toEqual(['high', 'low']);
  });

  test('因 timeout 触发时任务中调用 clearTasks 立即生效', () => {
    const task = new IdleTask<number>();
    const handler = vi.fn((n: number) => {
      if (n === 0) {
        task.clearTasks();
      }
    });
    for (let i = 0; i < 200; i++) task.enqueueTask(handler, i);

    scheduled[0].cb(timedOutIdleDeadline());

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('因 timeout 触发时单个任务抛错不会中断队列', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const task = new IdleTask<number>();
    const done: number[] = [];

    for (let i = 0; i < 5; i++) {
      task.enqueueTask((n) => {
        if (n === 2) throw new Error('boom');
        done.push(n);
      }, i);
    }

    expect(() => scheduled[0].cb(timedOutIdleDeadline())).not.toThrow();
    expect(done).toEqual([0, 1, 3, 4]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
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
    delete (globalThis as any).requestIdleCallback;
    delete (globalThis as any).cancelIdleCallback;
    // 重新加载模块以触发 polyfill 注册
    vi.resetModules();
    return import('@editor/utils/dep/idle-task').then(() => {
      expect(typeof globalThis.requestIdleCallback).toBe('function');
      expect(typeof globalThis.cancelIdleCallback).toBe('function');

      let deadline: IdleDeadline | undefined;
      const cb = vi.fn((current: IdleDeadline) => {
        deadline = current;
      });
      const id = globalThis.requestIdleCallback(cb);
      expect(id).toBeDefined();
      vi.runAllTimers();

      expect(cb).toHaveBeenCalled();
      // polyfill 走不到原生的 timeout 语义，didTimeout 恒为 false，并给出一帧内的剩余时间
      expect(deadline?.didTimeout).toBe(false);
      expect(deadline?.timeRemaining()).toBeLessThanOrEqual(50);
      expect(deadline?.timeRemaining()).toBeGreaterThanOrEqual(0);
    });
  });

  test('全局 cancelIdleCallback polyfill 取消后回调不再触发', () => {
    vi.useFakeTimers();
    delete (globalThis as any).requestIdleCallback;
    delete (globalThis as any).cancelIdleCallback;
    vi.resetModules();
    return import('@editor/utils/dep/idle-task').then(() => {
      const cb = vi.fn();
      const id = globalThis.requestIdleCallback(cb);
      globalThis.cancelIdleCallback(id);
      vi.runAllTimers();

      expect(cb).not.toHaveBeenCalled();
    });
  });
});
