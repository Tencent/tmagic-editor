export default class Store {
  private data: any;

  constructor({ initialData = {} }: { initialData?: any } = {}) {
    this.data = initialData;
  }

  public set(key: string, value: any) {
    this.data[key] = value;
  }

  public get(key: string) {
    return this.data[key];
  }
}
