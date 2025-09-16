export abstract class ObservedData {
  abstract update(data: any, path?: string): void;

  abstract on(path: string, callback: (newVal: any) => void, options?: { immediate?: boolean }): void;

  abstract off(path: string, callback: (newVal: any) => void): void;

  abstract getData(path: string): any;

  abstract destroy(): void;
}
