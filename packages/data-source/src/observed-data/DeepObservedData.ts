import State from 'deep-state-observer';

import { ObservedData } from './ObservedData';

const ignoreFirstCall = <F extends (...args: any[]) => any>(fn: F) => {
  let calledTimes = 0;
  return (...args: Parameters<F>) => {
    if (calledTimes === 0) {
      calledTimes += 1;
      return;
    }
    return fn(...args);
  };
};

export class DeepObservedData extends ObservedData {
  state?: State;
  subscribers = new Map<string, Map<Function, () => void>>();
  constructor(initialData: Record<string, any>) {
    super();
    this.state = new State(initialData);
  }
  update = (data: any, path?: string) => {
    this.state?.update(path ?? '', data);
  };
  on = (path: string, callback: (newVal: any) => void) => {
    // subscribe 会立即执行一次，ignoreFirstCall 会忽略第一次执行
    const unsubscribe = this.state!.subscribe(path, ignoreFirstCall(callback));

    // 把取消监听的函数保存下来，供 off 时调用
    const pathSubscribers = this.subscribers.get(path) ?? new Map<Function, () => void>();
    pathSubscribers.set(callback, unsubscribe);
    this.subscribers.set(path, pathSubscribers);
  };
  off = (path: string, callback: (newVal: any) => void) => {
    const pathSubscribers = this.subscribers.get(path);
    if (!pathSubscribers) return;

    pathSubscribers.get(callback)?.();
    pathSubscribers.delete(callback);
  };
  getData = (path: string) => (!this.state ? {} : this.state?.get(path));
  destroy = () => {
    // 销毁所有未被取消的监听
    this.subscribers.forEach((pathSubscribers) => {
      pathSubscribers.forEach((unsubscribe) => unsubscribe());
    });
  };
}
