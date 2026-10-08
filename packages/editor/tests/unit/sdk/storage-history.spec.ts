// @vitest-environment node
import { describe, expect, test, vi } from 'vitest';

import { createDslSdk, defaultParseDSL, MemoryStorage, Protocol } from '@editor/sdk';
import { isFixed } from '@editor/sdk/utils/position';

import { createSdk } from './helpers';

describe('MemoryStorage', () => {
  test('实现 Storage 接口', () => {
    const storage = new MemoryStorage();

    expect(storage.length).toBe(0);
    expect(storage.getItem('a')).toBeNull();

    storage.setItem('a', '1');
    storage.setItem('b', '2');
    expect(storage.length).toBe(2);
    expect(storage.getItem('a')).toBe('1');
    expect(storage.key(1)).toBe('b');
    expect(storage.key(5)).toBeNull();

    storage.removeItem('a');
    expect(storage.getItem('a')).toBeNull();

    storage.clear();
    expect(storage.length).toBe(0);
  });
});

describe('defaultParseDSL', () => {
  test('解析被括号包起来的 JSON，不执行代码', () => {
    expect(defaultParseDSL('({"a":1})')).toEqual({ a: 1 });
    expect(defaultParseDSL('{"a":1}')).toEqual({ a: 1 });
    expect(() => defaultParseDSL('(() => {})')).toThrow();
  });
});

describe('storage service', () => {
  test('各协议读写', () => {
    const sdk = createSdk();
    const { storage } = sdk;

    storage.setItem('str', 'hello');
    expect(storage.getItem('str')).toBe('hello');

    storage.setItem('num', 12, { protocol: Protocol.NUMBER });
    expect(storage.getItem('num', { protocol: Protocol.NUMBER })).toBe(12);

    storage.setItem('bool', true, { protocol: Protocol.BOOLEAN });
    expect(storage.getItem('bool', { protocol: Protocol.BOOLEAN })).toBe(true);

    storage.setItem('obj', { a: 1 }, { protocol: Protocol.OBJECT });
    expect(storage.getItem('obj', { protocol: Protocol.OBJECT })).toEqual({ a: 1 });

    expect(storage.getItem('none')).toBeNull();

    storage.removeItem('str');
    expect(storage.getItem('str')).toBeNull();

    storage.clear();
    expect(storage.getItem('num', { protocol: Protocol.NUMBER })).toBeNull();
  });

  test('注入自定义 storage', () => {
    const custom = new MemoryStorage();
    const sdk = createSdk({ storage: custom });

    sdk.storage.setItem('k', 'v');
    expect(custom.getItem('tmagic:k')).toBeTruthy();
    expect(sdk.storage.getStorage()).toBe(custom);
  });
});

describe('复制 / 粘贴', () => {
  test('copy 之后 paste 会生成新节点', async () => {
    const sdk = createSdk();
    await sdk.editor.update({ id: 'button_1', style: { position: 'absolute', left: 10, top: 20 } } as any);
    const node = sdk.editor.getNodeById('button_1')!;
    await sdk.editor.select('button_1');

    await sdk.editor.copy(node);
    const result = (await sdk.editor.paste({ left: 10, top: 10 })) as any;
    const pasted = Array.isArray(result) ? result[0] : result;

    expect(pasted).toBeTruthy();
    expect(pasted.id).not.toBe('button_1');
    expect(sdk.editor.getNodeById(pasted.id)).toBeTruthy();
  });

  test('没有复制内容时 paste 什么也不做', async () => {
    const sdk = createSdk();
    expect(await sdk.editor.paste()).toBeUndefined();
  });
});

describe('历史记录持久化', () => {
  const createPersistence = () => {
    const db = new Map<string, unknown>();
    return {
      db,
      get: vi.fn(async (dbName: string, storeName: string, key: IDBValidKey) =>
        db.get(`${dbName}/${storeName}/${String(key)}`),
      ),
      set: vi.fn(async (dbName: string, storeName: string, key: IDBValidKey, value: unknown) => {
        db.set(`${dbName}/${storeName}/${String(key)}`, value);
      }),
    };
  };

  test('没有提供 historyPersistence 时读写会失败，并提示改用 serialize / restore', async () => {
    const sdk = createSdk();

    await expect(sdk.history.saveToIndexedDB()).rejects.toThrow('historyPersistence');
    await expect(sdk.history.restoreFromIndexedDB()).rejects.toThrow('historyPersistence');
  });

  test('saveToIndexedDB / restoreFromIndexedDB 走注入的适配器', async () => {
    const persistence = createPersistence();
    const sdk = createSdk({ historyPersistence: persistence });
    await sdk.editor.update({ id: 'text_1', text: 'changed' } as any);

    await sdk.history.saveToIndexedDB();
    expect(persistence.set).toHaveBeenCalled();
    // 库名带上应用 id，使不同应用的历史互相隔离
    expect(persistence.set.mock.calls[0][0]).toContain('app_1');

    const other = createSdk({ dsl: sdk.getDsl(), historyPersistence: persistence });
    await other.history.restoreFromIndexedDB();
    await other.editor.undo();
    expect((other.editor.getNodeById('text_1') as any).text).toBe('${ds_1.name}');
  });

  test('serialize 默认保留 Map；jsonSafe 导出的快照可以 JSON 往返', async () => {
    const sdk = createSdk();
    await sdk.editor.update({ id: 'text_1', text: 'a' } as any);

    const raw = sdk.history.serialize();
    const jsonSafe = sdk.history.serialize({ jsonSafe: true });
    const step = Object.values(raw.steps.page)[0].elementList.find((item: any) => item.extra);

    expect(step.extra.modifiedNodeIds).toBeInstanceOf(Map);
    // 导出 jsonSafe 不会污染运行中的历史
    expect(
      Object.values(sdk.history.serialize().steps.page)[0].elementList.find((item: any) => item.extra).extra
        .modifiedNodeIds,
    ).toBeInstanceOf(Map);

    const copy = JSON.parse(JSON.stringify(jsonSafe));
    const restored = createDslSdk({ dsl: sdk.getDsl(), history: copy });
    expect(restored.history.serialize().steps.page).toBeTruthy();
  });

  test('代码块 / 数据源的历史同样可以导出恢复', async () => {
    const sdk = createSdk();
    sdk.dataSource.add({ id: 'ds_2', type: 'base', title: 'two', fields: [], methods: [], events: [] } as any);
    await sdk.codeBlock.setCodeDslById('code_2', { name: 'two', content: '() => {}', params: [] });

    const snapshot = JSON.parse(JSON.stringify(sdk.serializeHistory()));
    const restored = createSdk({ dsl: sdk.getDsl(), history: snapshot });

    expect(Object.keys(restored.history.serialize().steps.dataSource)).toContain('ds_2');
    expect(Object.keys(restored.history.serialize().steps.codeBlock)).toContain('code_2');
  });
});

describe('isFixed', () => {
  test('是否 fixed 定位', () => {
    expect(isFixed({ position: 'fixed' })).toBe(true);
    expect(isFixed({ position: 'absolute' })).toBe(false);
    expect(isFixed({})).toBe(false);
  });
});
