export default class Store {
  private data: Record<string, any> = {};

  public set(key: string, value: any) {
    this.data[key] = value;
  }

  public get(key: string) {
    return this.data[key];
  }
}
