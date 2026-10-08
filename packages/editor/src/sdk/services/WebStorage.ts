import serialize from 'serialize-javascript';
import type { Writable } from 'type-fest';

import type { SyncHookPlugin } from '@editor/type';

import type { SdkContext, StorageLike } from '../type';

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

const canUsePluginMethods = {
  async: [],
  sync: ['getStorage', 'getNamespace', 'clear', 'getItem', 'removeItem', 'setItem'] as const,
};

type SyncMethodName = Writable<(typeof canUsePluginMethods)['sync']>;

/** 默认的内存存储，Node 下没有 localStorage 时使用 */
export class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();

  get length() {
    return this.map.size;
  }

  clear() {
    this.map.clear();
  }

  getItem(key: string) {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }

  key(index: number) {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.map.delete(key);
  }

  setItem(key: string, value: string) {
    this.map.set(key, `${value}`);
  }
}

/**
 * 数据存储服务
 */
export class WebStorage extends BaseService {
  private storage: StorageLike;
  private namespace = 'tmagic';

  constructor(
    private ctx: SdkContext,
    storage?: StorageLike,
  ) {
    super(canUsePluginMethods.sync.map((methodName) => ({ name: methodName, isAsync: false })));
    this.storage = storage ?? new MemoryStorage();
  }

  /**
   * 获取数据存储对象，可以通过
   * const storageService = new StorageService();
   * storageService.usePlugin({
   *    // 替换存储对象为 sessionStorage
   *    async afterGetStorage(): Promise<StorageLike> {
   *      return window.sessionStorage;
   *    },
   * });
   */
  public getStorage(): StorageLike {
    return this.storage;
  }

  public getNamespace(): string {
    return this.namespace;
  }

  /**
   * 清理，支持storageService.usePlugin
   */
  public clear(): void {
    const storage = this.getStorage();
    storage.clear();
  }
  /**
   * 获取存储项，支持storageService.usePlugin
   */
  public getItem(key: string, options: Options = {}): any {
    const storage = this.getStorage();
    const namespace = this.getNamespace();
    const { protocol = options.protocol, item } = this.getValueAndProtocol(
      storage.getItem(`${options.namespace || namespace}:${key}`),
    );

    if (item === null) return null;

    switch (protocol) {
      case Protocol.OBJECT:
        return this.ctx.parseDSL(`(${item})`);
      case Protocol.JSON:
        return JSON.parse(item);
      case Protocol.NUMBER:
        return Number(item);
      case Protocol.BOOLEAN:
        if (item === 'true') return true;
        if (item === 'false') return false;
      default:
        return item;
    }
  }
  /**
   * 获取指定索引位置的key
   */
  public key(index: number): string | null {
    const storage = this.getStorage();
    return storage.key(index);
  }

  /**
   * 移除存储项，支持storageService.usePlugin
   */
  public removeItem(key: string, options: Options = {}): void {
    const storage = this.getStorage();
    const namespace = this.getNamespace();
    storage.removeItem(`${options.namespace || namespace}:${key}`);
  }

  /**
   * 设置存储项，支持storageService.usePlugin
   */
  public setItem(key: string, value: any, options: Options = {}): void {
    const storage = this.getStorage();
    const namespace = this.getNamespace();
    let item = value;
    const protocol = options.protocol ? `${options.protocol}:` : '';
    if (typeof value === Protocol.STRING || typeof value === Protocol.NUMBER) {
      item = `${protocol}${value}`;
    } else {
      item = `${protocol}${serialize(value)}`;
    }
    storage.setItem(`${options.namespace || namespace}:${key}`, item);
  }

  public destroy() {
    this.removeAllListeners();
    this.removeAllPlugins();
  }

  public usePlugin(options: SyncHookPlugin<SyncMethodName, WebStorage>): void {
    super.usePlugin(options);
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
export default WebStorage;
