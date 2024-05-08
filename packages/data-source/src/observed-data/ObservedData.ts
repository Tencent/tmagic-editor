export abstract class ObservedData {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(_data: Record<string, any>) {}

  abstract update(path: string, data: any): void;

  abstract on(path: string, callback: (newVal: any) => void): void;

  abstract off(path: string, callback: (newVal: any) => void): void;

  abstract getData(path: string): any;

  abstract destroy(): void;
}
