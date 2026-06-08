/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * 一组极简的、基于原生 IndexedDB 的 Promise KV 工具，避免引入额外依赖。
 * 仅用于浏览器环境；在不支持 IndexedDB 的环境（如 SSR / 部分测试环境）下会 reject。
 */

/** 是否处于支持 IndexedDB 的环境。 */
export const isIndexedDBSupported = (): boolean => typeof indexedDB !== 'undefined' && indexedDB !== null;

/**
 * 打开（必要时升级）数据库，确保目标 objectStore 存在后返回连接。
 *
 * 由于 objectStore 只能在 `onupgradeneeded` 内创建，这里先以当前版本打开，
 * 若发现 store 不存在则关闭连接、以更高版本重开来按需创建，兼容动态 storeName。
 */
export const openIndexedDB = (dbName: string, storeName: string): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      reject(new Error('当前环境不支持 IndexedDB'));
      return;
    }

    const request = indexedDB.open(dbName);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(storeName)) {
        resolve(db);
        return;
      }

      // store 不存在：以更高版本重开，在 onupgradeneeded 中创建。
      const nextVersion = db.version + 1;
      db.close();
      const upgradeRequest = indexedDB.open(dbName, nextVersion);
      upgradeRequest.onupgradeneeded = () => {
        const upgradeDb = upgradeRequest.result;
        if (!upgradeDb.objectStoreNames.contains(storeName)) {
          upgradeDb.createObjectStore(storeName);
        }
      };
      upgradeRequest.onerror = () => reject(upgradeRequest.error);
      upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
    };
  });

/** 写入（覆盖）一条记录。value 通过结构化克隆存储，支持 Map / Set 等结构。 */
export const idbSet = async (dbName: string, storeName: string, key: IDBValidKey, value: unknown): Promise<void> => {
  const db = await openIndexedDB(dbName, storeName);
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

/** 读取一条记录，不存在时返回 undefined。 */
export const idbGet = async <T = unknown>(
  dbName: string,
  storeName: string,
  key: IDBValidKey,
): Promise<T | undefined> => {
  const db = await openIndexedDB(dbName, storeName);
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

/** 删除一条记录。 */
export const idbDelete = async (dbName: string, storeName: string, key: IDBValidKey): Promise<void> => {
  const db = await openIndexedDB(dbName, storeName);
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};
