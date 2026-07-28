import { EventEmitter } from 'events';

import { error } from '../logger';

export interface IdleTaskEvents {
  finish: [];
  'hight-level-finish': [];
  'update-task-length': [{ length: number; hightLevelLength: number }];
}

type TaskList<T> = {
  handler: (data: T) => void;
  data: T;
}[];

globalThis.requestIdleCallback =
  globalThis.requestIdleCallback ||
  function (cb) {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining() {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };

globalThis.cancelIdleCallback =
  globalThis.cancelIdleCallback ||
  function (handle) {
    clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
  };

export class IdleTask<T = any> extends EventEmitter {
  private taskList: TaskList<T> = [];

  private hightLevelTaskList: TaskList<T> = [];

  private taskHandle: number | null = null;

  constructor() {
    super();
    this.setMaxListeners(1000);
  }

  public enqueueTask(taskHandler: (data: T) => void, taskData: T, isHightLevel = false) {
    (isHightLevel ? this.hightLevelTaskList : this.taskList).push({
      handler: taskHandler,
      data: taskData,
    });

    if (!this.taskHandle) {
      this.taskHandle = globalThis.requestIdleCallback(this.runTaskQueue.bind(this), { timeout: 10000 });
    }
  }

  public clearTasks() {
    if (this.taskHandle) {
      globalThis.cancelIdleCallback(this.taskHandle);
    }

    this.hightLevelTaskList = [];
    this.taskList = [];
    this.taskHandle = null;

    this.emit('update-task-length', {
      length: this.getTaskLength(),
      hightLevelLength: this.hightLevelTaskList.length,
    });
  }

  public on<Name extends keyof IdleTaskEvents, Param extends IdleTaskEvents[Name]>(
    eventName: Name,
    listener: (...args: Param) => void | Promise<void>,
  ) {
    return super.on(eventName, listener as any);
  }

  public once<Name extends keyof IdleTaskEvents, Param extends IdleTaskEvents[Name]>(
    eventName: Name,
    listener: (...args: Param) => void | Promise<void>,
  ) {
    return super.once(eventName, listener as any);
  }

  public emit<Name extends keyof IdleTaskEvents, Param extends IdleTaskEvents[Name]>(eventName: Name, ...args: Param) {
    return super.emit(eventName, ...args);
  }

  private runTaskQueue(deadline: IdleDeadline) {
    // 本次回调已触发，句柄随之失效；置空后 clearTasks / enqueueTask 才能正确判断是否需要重新调度
    this.taskHandle = null;

    try {
      // 动画会占用空闲时间,当任务一直无法执行时，看看是否有动画正在播放
      // 根据空闲时间的多少来决定执行的任务数，保证页面不卡死的情况下尽量多执行任务，不然当任务数巨大时，执行时间会很久
      // 执行不完不会影响配置，但是会影响画布渲染
      while (deadline.timeRemaining() > 0 && this.getTaskLength()) {
        const timeRemaining = deadline.timeRemaining();
        let times = 0;
        if (timeRemaining <= 5) {
          times = 10;
        } else if (timeRemaining <= 10) {
          times = 100;
        } else if (timeRemaining <= 15) {
          times = 300;
        } else {
          times = 600;
        }

        for (let i = 0; i < times; i++) {
          // 每次都从实例上取队列，任务执行过程中调用 clearTasks 能立即生效，不会继续消费已被清空的旧队列
          const task = this.hightLevelTaskList.length > 0 ? this.hightLevelTaskList.shift() : this.taskList.shift();
          if (task) {
            this.runTask(task);
          }

          if (!this.getTaskLength()) {
            break;
          }
        }
      }
    } finally {
      // 必须放在 finally 中：一旦这里被跳过，taskHandle 会一直是真值，
      // enqueueTask 也就不会再重新调度，剩余任务与任务数将永久停在当前状态
      this.finishRun();
    }
  }

  /**
   * 单个任务失败不能中断整个队列，否则后续任务永远不会被执行，
   * 依赖收集会停在半路（收集中状态与剩余任务数都不再变化）
   */
  private runTask(task: TaskList<T>[number]) {
    try {
      task.handler(task.data);
    } catch (e) {
      error('magic editor: 空闲任务执行失败', e);
    }
  }

  private finishRun() {
    try {
      if (!this.hightLevelTaskList.length) {
        this.emit('hight-level-finish');
      }
    } finally {
      if (this.getTaskLength()) {
        // 任务执行或事件监听中可能已经重新调度过
        if (!this.taskHandle) {
          this.taskHandle = globalThis.requestIdleCallback(this.runTaskQueue.bind(this), { timeout: 300 });
        }
      } else {
        this.emit('finish');
      }

      this.emit('update-task-length', {
        length: this.getTaskLength(),
        hightLevelLength: this.hightLevelTaskList.length,
      });
    }
  }

  private getTaskLength() {
    return this.taskList.length + this.hightLevelTaskList.length;
  }
}
