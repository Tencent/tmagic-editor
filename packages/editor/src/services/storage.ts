import serialize from 'serialize-javascript';

import BaseService from './BaseService';

interface Options {
  namespace?: string;
  protocol?: Protocol;
}

export enum Protocol {
  OBJECT = 'object',
  JSON = 'json',
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

/**
 * 数据存储服务
 */
export class WebStorage extends BaseService {
  private storage: Storage = globalThis.localStorage;
  private namespace = 'tmagic';

  constructor() {
    super(['getStorage', 'getNamespace', 'clear', 'getItem', 'removeItem', 'setItem']);
  }

  /**
   * 获取数据存储对象，可以通过
   * const storageService = new StorageService();
   * storageService.usePlugin({
   *    // 替换存储对象为 sessionStorage
   *    async afterGetStorage(): Promise<Storage> {
   *      return window.sessionStorage;
   *    },
   * });
   */
  public async getStorage(): Promise<Storage> {
    return this.storage;
  }

  public async getNamespace(): Promise<string> {
    return this.namespace;
  }

  /**
   * 清理，支持storageService.usePlugin
   */
  public async clear(): Promise<void> {
    const storage = await this.getStorage();
    storage.clear();
  }
  /**
   * 获取存储项，支持storageService.usePlugin
   */
  public async getItem(key: string, options: Options = {}): Promise<any> {
    const [storage, namespace] = await Promise.all([this.getStorage(), this.getNamespace()]);
    const { protocol = options.protocol, item } = this.getValueAndProtocol(
      storage.getItem(`${options.namespace || namespace}:${key}`),
    );

    if (item === null) return null;

    switch (protocol) {
      case Protocol.OBJECT:
        // eslint-disable-next-line no-eval
        return eval(`(${item})`);
      case Protocol.JSON:
        return JSON.parse(item);
      case Protocol.NUMBER:
        return Number(item);
      case Protocol.BOOLEAN:
        return Boolean(item);
      default:
        return item;
    }
  }
  /**
   * 获取指定索引位置的key
   */
  public async key(index: number): Promise<string | null> {
    const storage = await this.getStorage();
    return storage.key(index);
  }

  /**
   * 移除存储项，支持storageService.usePlugin
   */
  public async removeItem(key: string, options: Options = {}): Promise<void> {
    const [storage, namespace] = await Promise.all([this.getStorage(), this.getNamespace()]);
    storage.removeItem(`${options.namespace || namespace}:${key}`);
  }

  /**
   * 设置存储项，支持storageService.usePlugin
   */
  public async setItem(key: string, value: any, options: Options = {}): Promise<void> {
    const [storage, namespace] = await Promise.all([this.getStorage(), this.getNamespace()]);
    let item = value;
    const protocol = options.protocol ? `${options.protocol}:` : '';
    if (typeof value === Protocol.STRING || typeof value === Protocol.NUMBER) {
      item = `${protocol}${value}`;
    } else {
      item = `${protocol}${serialize(value)}`;
    }
    storage.setItem(`${options.namespace || namespace}:${key}`, item);
  }

  private getValueAndProtocol(value: string | null) {
    let protocol = '';

    if (value === null) {
      return {
        item: value,
        protocol,
      };
    }

    const item = value.replace(new RegExp(`^(${Object.values(Protocol).join('|')})(:)(.+)`), (_$0, $1, _$2, $3) => {
      protocol = $1;
      return $3;
    });

    return {
      protocol,
      item,
    };
  }
}

export type StorageService = WebStorage;
export default new WebStorage();
