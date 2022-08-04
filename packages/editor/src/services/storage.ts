import BaseService from './BaseService';

/**
 * 数据存储服务
 */
export class StorageService extends BaseService {
  constructor() {
    super(['getStorage', 'clear', 'getItem', 'removeItem', 'setItem']);
  }

  /**
   * 获取数据存储对象，可以通过
   * const storageService = new StorageService();
   * storageService.use({
   *    // 替换存储对象为 sessionStorage
   *    async getStorage(): Promise<Storage> {
   *    return window.sessionStorage;
   *    },
   * });
   */
  public async getStorage(): Promise<Storage> {
    return globalThis.localStorage;
  }
  /**
   * 清理，支持storageService.use
   */
  public async clear(): Promise<void> {
    const storage = await this.getStorage();
    storage.clear();
  }
  /**
   * 获取存储项，支持storageService.use
   */
  public async getItem(key: string): Promise<string | null> {
    const storage = await this.getStorage();
    return storage.getItem(key);
  }
  /**
   * 获取指定索引位置的key
   */
  public async key(index: number): Promise<string | null> {
    const storage = await this.getStorage();
    return storage.key(index);
  }
  /**
   * 移除存储项，支持storageService.use
   */
  public async removeItem(key: string): Promise<void> {
    const storage = await this.getStorage();
    storage.removeItem(key);
  }
  /**
   * 设置存储项，支持storageService.use
   */
  public async setItem(key: string, value: string): Promise<void> {
    const storage = await this.getStorage();
    storage.setItem(key, value);
  }
}

export default new StorageService();
