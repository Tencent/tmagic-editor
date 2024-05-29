import { EventEmitter } from 'events';

export interface IdleTaskEvents {
  finish: [];
}

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
  private taskList: {
    handler: (data: T) => void;
    data: T;
  }[] = [];

  private taskHandle: number | null = null;

  public enqueueTask(taskHandler: (data: T) => void, taskData: T) {
    this.taskList.push({
      handler: taskHandler,
      data: taskData,
    });

    if (!this.taskHandle) {
      this.taskHandle = globalThis.requestIdleCallback(this.runTaskQueue.bind(this), { timeout: 10000 });
    }
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
    while ((deadline.timeRemaining() > 15 || deadline.didTimeout) && this.taskList.length) {
      const task = this.taskList.shift();
      task!.handler(task!.data);
    }

    if (this.taskList.length) {
      this.taskHandle = globalThis.requestIdleCallback(this.runTaskQueue.bind(this), { timeout: 10000 });
    } else {
      this.taskHandle = 0;

      this.emit('finish');
    }
  }
}
