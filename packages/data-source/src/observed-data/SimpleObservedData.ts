import { EventEmitter } from 'events';

import { getValueByKeyPath, setValueByKeyPath } from '@tmagic/utils';

import { ObservedData } from './ObservedData';

export class SimpleObservedData extends ObservedData {
  data: Record<string, any> = {};
  private event = new EventEmitter();

  constructor(initialData: Record<string, any>) {
    super();
    this.data = initialData;
  }

  update(data: any, path?: string): void {
    if (path) {
      setValueByKeyPath(path, data, this.data);
    } else {
      this.data = data;
    }

    const changeEvent = {
      updateData: data,
      path: path ?? '',
    };

    if (path) {
      this.event.emit(path, changeEvent);
    }

    this.event.emit('', changeEvent);
  }

  on(path: string, callback: (newVal: any) => void): void {
    this.event.on(path, callback);
  }

  off(path: string, callback: (newVal: any) => void): void {
    this.event.off(path, callback);
  }

  getData(path: string) {
    return path ? getValueByKeyPath(path, this.data) : this.data;
  }

  destroy(): void {}
}
