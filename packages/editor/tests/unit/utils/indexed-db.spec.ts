/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { idbDelete, idbGet, idbSet, isIndexedDBSupported, openIndexedDB } from '@editor/utils/indexed-db';

type StoreRecord = Map<IDBValidKey, unknown>;

interface FakeDb {
  version: number;
  stores: Map<string, StoreRecord>;
}

const fakeDbs = new Map<string, FakeDb>();

const createRequest = <T>(result: T, error: DOMException | null = null) => {
  const request = {
    result,
    error,
    onsuccess: null as null | (() => void),
    onerror: null as null | (() => void),
    onupgradeneeded: null as null | (() => void),
  };
  queueMicrotask(() => {
    if (error) {
      request.onerror?.();
    } else {
      request.onsuccess?.();
    }
  });
  return request;
};

const installFakeIndexedDB = () => {
  fakeDbs.clear();
  const indexedDB = {
    open: vi.fn((name: string, version?: number) => {
      const existing = fakeDbs.get(name);
      const nextVersion = version ?? existing?.version ?? 1;
      const db: FakeDb = existing ?? { version: nextVersion, stores: new Map() };
      if (version !== undefined && version > (existing?.version ?? 0)) {
        db.version = version;
      }
      fakeDbs.set(name, db);

      const idbDatabase = {
        name,
        version: db.version,
        objectStoreNames: {
          contains: (storeName: string) => db.stores.has(storeName),
        },
        createObjectStore: (storeName: string) => {
          if (!db.stores.has(storeName)) {
            db.stores.set(storeName, new Map());
          }
          return {};
        },
        close: vi.fn(),
        transaction: (storeName: string, mode: IDBTransactionMode) => {
          const store = db.stores.get(storeName) ?? new Map<IDBValidKey, unknown>();
          if (!db.stores.has(storeName)) {
            db.stores.set(storeName, store);
          }
          const tx = {
            error: null as DOMException | null,
            objectStore: () => ({
              put: (value: unknown, key: IDBValidKey) => {
                if (mode === 'readonly') {
                  return createRequest(undefined, new DOMException('readonly'));
                }
                store.set(key, value);
                return createRequest(undefined);
              },
              get: (key: IDBValidKey) => createRequest(store.get(key)),
              delete: (key: IDBValidKey) => {
                if (mode === 'readonly') {
                  return createRequest(undefined, new DOMException('readonly'));
                }
                store.delete(key);
                return createRequest(undefined);
              },
            }),
            oncomplete: null as null | (() => void),
            onabort: null as null | (() => void),
            onerror: null as null | (() => void),
          };
          queueMicrotask(() => tx.oncomplete?.());
          return tx;
        },
      };

      const request = createRequest(idbDatabase);
      request.onupgradeneeded = () => {
        if (!db.stores.has('__placeholder__')) {
          // no-op: upgrade hook exists for API compatibility
        }
      };
      queueMicrotask(() => request.onupgradeneeded?.());
      return request;
    }),
  };

  vi.stubGlobal('indexedDB', indexedDB);
  return indexedDB;
};

describe('indexed-db utils', () => {
  beforeEach(() => {
    installFakeIndexedDB();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('isIndexedDBSupported 在存在 indexedDB 时返回 true', () => {
    expect(isIndexedDBSupported()).toBe(true);
  });

  test('isIndexedDBSupported 在无 indexedDB 环境返回 false', () => {
    vi.stubGlobal('indexedDB', undefined);
    expect(isIndexedDBSupported()).toBe(false);
  });

  test('openIndexedDB 在不支持 IndexedDB 时 reject', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(openIndexedDB('db', 'store')).rejects.toThrow('当前环境不支持 IndexedDB');
  });

  test('openIndexedDB 在 store 不存在时会升级创建', async () => {
    const db = await openIndexedDB('tmagic-test', 'history');
    expect(db.objectStoreNames.contains('history')).toBe(true);
    db.close();
  });

  test('idbSet / idbGet / idbDelete 可读写删除记录', async () => {
    await idbSet('tmagic-kv', 'items', 'k1', { hello: 'world' });
    await expect(idbGet('tmagic-kv', 'items', 'k1')).resolves.toEqual({ hello: 'world' });

    await idbDelete('tmagic-kv', 'items', 'k1');
    await expect(idbGet('tmagic-kv', 'items', 'k1')).resolves.toBeUndefined();
  });

  test('idbGet 读取不存在的 key 返回 undefined', async () => {
    await expect(idbGet('tmagic-kv', 'items', 'missing')).resolves.toBeUndefined();
  });
});
