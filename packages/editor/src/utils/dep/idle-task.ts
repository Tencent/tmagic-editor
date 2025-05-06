import { EventEmitter } from 'events';

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
      length: this.taskList.length + this.hightLevelTaskList.length,
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
    const { hightLevelTaskList, taskList } = this;

    // 动画会占用空闲时间,当任务一直无法执行时，看看是否有动画正在播放
    // 根据空闲时间的多少来决定执行的任务数，保证页面不卡死的情况下尽量多执行任务，不然当任务数巨大时，执行时间会很久
    // 执行不完不会影响配置，但是会影响画布渲染
    while (deadline.timeRemaining() > 0 && (taskList.length || hightLevelTaskList.length)) {
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
        const task = hightLevelTaskList.length > 0 ? hightLevelTaskList.shift() : taskList.shift();
        if (task) {
          task.handler(task.data);
        }

        if (hightLevelTaskList.length === 0 && taskList.length === 0) {
          break;
        }
      }
    }

    if (!hightLevelTaskList.length) {
      this.emit('hight-level-finish');
    }

    if (hightLevelTaskList.length || taskList.length) {
      this.taskHandle = globalThis.requestIdleCallback(this.runTaskQueue.bind(this), { timeout: 300 });
    } else {
      this.taskHandle = 0;

      this.emit('finish');
    }

    this.emit('update-task-length', {
      length: taskList.length + hightLevelTaskList.length,
      hightLevelLength: hightLevelTaskList.length,
    });
  }
}
