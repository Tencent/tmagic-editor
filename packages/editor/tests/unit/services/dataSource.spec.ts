/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import dataSource from '@editor/services/dataSource';
import historyService from '@editor/services/history';
import storageService, { Protocol } from '@editor/services/storage';
import { setEditorConfig } from '@editor/utils/config';
import { COPY_DS_STORAGE_KEY } from '@editor/utils/editor';

vi.mock('@editor/services/editor', () => ({
  default: {
    getNodeById: vi.fn((id: string) => ({ id, dsBinding: ['ds1'] })),
  },
}));

setEditorConfig({
  // eslint-disable-next-line no-new-func
  parseDSL: ((str: string) => new Function(`return ${str}`)()) as any,
} as any);

beforeEach(() => {
  dataSource.resetState();
  dataSource.set('configs', {});
  dataSource.set('values', {});
  dataSource.set('events', {});
  dataSource.set('methods', {});
  historyService.reset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('DataSource service', () => {
  test('setFormConfig / getFormConfig 取自 configs', () => {
    const config = [{ type: 'text' }] as any;
    dataSource.setFormConfig('http', config);
    const result = dataSource.getFormConfig('http');
    expect(Array.isArray(result)).toBe(true);
  });

  test('setFormValue / getFormValue', () => {
    dataSource.setFormValue('http', { id: 'x', title: 'T' } as any);
    const v = dataSource.getFormValue('http');
    expect(v).toBeDefined();
  });

  test('setFormEvent / getFormEvent 默认空数组', () => {
    expect(dataSource.getFormEvent('http')).toEqual([]);
    dataSource.setFormEvent('http', [{ name: 'click' }] as any);
    expect(dataSource.getFormEvent('http')).toHaveLength(1);
  });

  test('setFormMethod / getFormMethod 默认空数组', () => {
    expect(dataSource.getFormMethod('http')).toEqual([]);
    dataSource.setFormMethod('http', [{ name: 'send' }] as any);
    expect(dataSource.getFormMethod('http')).toHaveLength(1);
  });

  test('add - 没有 id 时自动生成', () => {
    const fn = vi.fn();
    dataSource.on('add', fn);
    const ds = dataSource.add({ title: 'a', type: 'base' } as any);
    expect(ds.id?.startsWith('ds_')).toBe(true);
    expect(fn).toHaveBeenCalled();
    dataSource.off('add', fn);
  });

  test('add - 已有 id 重复时重新生成', () => {
    dataSource.add({ id: 'x', title: 'a', type: 'base' } as any);
    const ds = dataSource.add({ id: 'x', title: 'a2', type: 'base' } as any);
    expect(ds.id).not.toBe('x');
  });

  test('update - 修改已有数据源并触发事件', () => {
    const fn = vi.fn();
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    dataSource.on('update', fn);
    const newConfig = { ...created, title: 'b' } as any;
    dataSource.update(newConfig);
    expect(dataSource.getDataSourceById(created.id!)?.title).toBe('b');
    expect(fn).toHaveBeenCalled();
    dataSource.off('update', fn);
  });

  test('remove - 触发 remove 事件', () => {
    const fn = vi.fn();
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    dataSource.on('remove', fn);
    dataSource.remove(created.id!);
    expect(dataSource.getDataSourceById(created.id!)).toBeUndefined();
    expect(fn).toHaveBeenCalledWith(created.id);
    dataSource.off('remove', fn);
  });

  test('createId 以 ds_ 开头', () => {
    expect(dataSource.createId().startsWith('ds_')).toBe(true);
  });

  test('paste - 不覆盖现有数据源', () => {
    dataSource.add({ id: 'a', title: 'A', type: 'base' } as any);
    storageService.setItem(
      COPY_DS_STORAGE_KEY,
      [
        { id: 'a', title: 'A2', type: 'base' },
        { id: 'b', title: 'B', type: 'base' },
      ],
      { protocol: Protocol.OBJECT },
    );
    dataSource.paste();
    expect(dataSource.getDataSourceById('a')?.title).toBe('A');
    expect(dataSource.getDataSourceById('b')?.title).toBe('B');
  });

  test('copyWithRelated - 没有 collectorOptions 时只写空数组', () => {
    dataSource.copyWithRelated([]);
    expect(storageService.getItem(COPY_DS_STORAGE_KEY)).toEqual([]);
  });

  test('destroy 清空 listeners', () => {
    const fn = vi.fn();
    dataSource.on('add', fn);
    dataSource.destroy();
    dataSource.emit('add', {});
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('DataSource service - 历史记录接入', () => {
  test('add - 入历史（oldSchema=null）', () => {
    const ds = dataSource.add({ title: 'a', type: 'base' } as any);
    expect(historyService.canUndoDataSource(ds.id!)).toBe(true);
    const step = historyService.undoDataSource(ds.id!);
    expect(step?.oldSchema).toBeNull();
    expect(step?.newSchema?.title).toBe('a');
  });

  test('update - 入历史，oldSchema 是旧值，newSchema 是新值', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    // 清掉 add 推入的那条
    historyService.reset();

    dataSource.update({ ...created, title: 'b' } as any);
    const step = historyService.undoDataSource(created.id!);
    expect(step?.oldSchema?.title).toBe('a');
    expect(step?.newSchema?.title).toBe('b');
  });

  test('remove - 入历史（newSchema=null）', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    historyService.reset();

    dataSource.remove(created.id!);
    const step = historyService.undoDataSource(created.id!);
    expect(step?.oldSchema?.title).toBe('a');
    expect(step?.newSchema).toBeNull();
  });

  test('remove - 不存在的 id 不入历史', () => {
    dataSource.remove('ghost');
    expect(historyService.canUndoDataSource('ghost')).toBe(false);
  });

  test('update - 携带 changeRecords 时写入历史 step', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    historyService.reset();

    dataSource.update({ ...created, title: 'b' } as any, {
      changeRecords: [{ propPath: 'title', value: 'b' }],
    });

    const step = historyService.undoDataSource(created.id!);
    expect(step?.changeRecords).toEqual([{ propPath: 'title', value: 'b' }]);
  });

  test('update - 不传 changeRecords 时 step.changeRecords 为 undefined', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    historyService.reset();

    dataSource.update({ ...created, title: 'b' } as any);
    const step = historyService.undoDataSource(created.id!);
    expect(step?.changeRecords).toBeUndefined();
  });
});

describe('DataSource service - *AndGetHistoryId', () => {
  const lastStepUuid = (id: string) => {
    const list = historyService.getDataSourceStepList(id);
    return list[list.length - 1]?.step.uuid;
  };

  test('addAndGetHistoryId 返回本次写入历史记录的 uuid', () => {
    const ds = dataSource.add({ id: 'temp', title: 'a', type: 'base' } as any);
    historyService.reset();

    const historyId = dataSource.addAndGetHistoryId({ id: 'ds_new', title: 'a', type: 'base' } as any);
    expect(typeof historyId).toBe('string');
    expect(historyId).toBe(lastStepUuid('ds_new'));
    // 与默认 add 行为一致：仍会写入数据源
    expect(dataSource.getDataSourceById('ds_new')).toBeDefined();
    expect(ds).toBeDefined();
  });

  test('addAndGetHistoryId 传 doNotPushHistory 时返回 null', () => {
    const historyId = dataSource.addAndGetHistoryId({ id: 'ds_x', title: 'a', type: 'base' } as any, {
      doNotPushHistory: true,
    });
    expect(historyId).toBeNull();
  });

  test('updateAndGetHistoryId 返回本次写入历史记录的 uuid', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    historyService.reset();

    const historyId = dataSource.updateAndGetHistoryId({ ...created, title: 'b' } as any);
    expect(typeof historyId).toBe('string');
    expect(historyId).toBe(lastStepUuid(created.id!));
  });

  test('removeAndGetHistoryId 返回本次写入历史记录的 uuid；不存在的 id 返回 null', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    historyService.reset();

    const historyId = dataSource.removeAndGetHistoryId(created.id!);
    expect(typeof historyId).toBe('string');
    expect(historyId).toBe(lastStepUuid(created.id!));

    expect(dataSource.removeAndGetHistoryId('ghost')).toBeNull();
  });
});

describe('DataSource service - revertById', () => {
  test('通过 uuid 回滚 add（移除数据源）', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    const uuid = historyService.getDataSourceStepList(created.id!).slice(-1)[0]?.step.uuid;
    expect(typeof uuid).toBe('string');
    expect(dataSource.getDataSourceById(created.id!)).toBeDefined();

    const reverted = dataSource.revertById(uuid!);
    expect(reverted).not.toBeNull();
    expect(dataSource.getDataSourceById(created.id!)).toBeUndefined();
  });

  test('通过 uuid 回滚等价于按 (id, index) 回滚', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    const uuid = historyService.getDataSourceStepList(created.id!).slice(-1)[0]?.step.uuid;

    const location = historyService.findDataSourceStepLocationByUuid(uuid!);
    expect(location).toEqual({ id: created.id, index: 0 });
  });

  test('找不到 uuid 时返回 null', () => {
    dataSource.add({ title: 'a', type: 'base' } as any);
    expect(dataSource.revertById('not-exist')).toBeNull();
    expect(dataSource.revertById('')).toBeNull();
  });
});

describe('DataSource service - undo / redo', () => {
  test('undo / redo - 新增场景：撤销=移除，重做=再添加', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);

    // undo 后数据源应被移除
    const undoStep = dataSource.undo(created.id!);
    expect(undoStep).not.toBeNull();
    expect(dataSource.getDataSourceById(created.id!)).toBeUndefined();

    // redo 后数据源应被重新添加
    const redoStep = dataSource.redo(created.id!);
    expect(redoStep).not.toBeNull();
    expect(dataSource.getDataSourceById(created.id!)?.title).toBe('a');
  });

  test('undo / redo - 删除场景：撤销=还原，重做=再删除', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    historyService.reset();

    dataSource.remove(created.id!);
    expect(dataSource.getDataSourceById(created.id!)).toBeUndefined();

    dataSource.undo(created.id!);
    expect(dataSource.getDataSourceById(created.id!)?.title).toBe('a');

    dataSource.redo(created.id!);
    expect(dataSource.getDataSourceById(created.id!)).toBeUndefined();
  });

  test('undo / redo - 更新场景（无 changeRecords）：整 schema 替换', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    historyService.reset();

    dataSource.update({ ...created, title: 'b' } as any);
    expect(dataSource.getDataSourceById(created.id!)?.title).toBe('b');

    dataSource.undo(created.id!);
    expect(dataSource.getDataSourceById(created.id!)?.title).toBe('a');

    dataSource.redo(created.id!);
    expect(dataSource.getDataSourceById(created.id!)?.title).toBe('b');
  });

  test('undo / redo - 更新场景（带 changeRecords）：按 propPath 局部 patch，不冲掉同节点其它字段', () => {
    const created = dataSource.add({ title: 'a', type: 'base', description: 'origin' } as any);
    historyService.reset();

    // 模拟 form 端只更新 title
    dataSource.update({ ...created, title: 'b', description: 'origin' } as any, {
      changeRecords: [{ propPath: 'title', value: 'b' }],
    });

    // 在两次 update 之间用户又改了同节点的另一个字段（不入历史，模拟外部同步）
    dataSource.update({ ...dataSource.getDataSourceById(created.id!), description: 'changed-by-other' } as any, {
      doNotPushHistory: true,
    });

    // undo 应只回滚 title，不影响 description
    dataSource.undo(created.id!);
    const after = dataSource.getDataSourceById(created.id!);
    expect(after?.title).toBe('a');
    expect(after?.description).toBe('changed-by-other');

    // redo 应只重做 title
    dataSource.redo(created.id!);
    const redo = dataSource.getDataSourceById(created.id!);
    expect(redo?.title).toBe('b');
    expect(redo?.description).toBe('changed-by-other');
  });

  test('undo / redo - 通过 add / update / remove 触发事件，依赖收集链路保留', () => {
    const addFn = vi.fn();
    const updateFn = vi.fn();
    const removeFn = vi.fn();
    dataSource.on('add', addFn);
    dataSource.on('update', updateFn);
    dataSource.on('remove', removeFn);

    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    addFn.mockClear();

    // 撤销新增 → 触发 remove 事件，initService 中的 dataSourceRemoveHandler 会清依赖
    dataSource.undo(created.id!);
    expect(removeFn).toHaveBeenCalledWith(created.id);

    // 重做新增 → 触发 add 事件，initService 会重新 collectIdle
    dataSource.redo(created.id!);
    expect(addFn).toHaveBeenCalled();

    // 推入一次 update 历史，再 undo 触发 update 事件
    historyService.reset();
    dataSource.update({ ...created, title: 'b' } as any);
    updateFn.mockClear();
    dataSource.undo(created.id!);
    expect(updateFn).toHaveBeenCalled();

    dataSource.off('add', addFn);
    dataSource.off('update', updateFn);
    dataSource.off('remove', removeFn);
  });

  test('undo / redo - 写回时不会再次入历史栈', () => {
    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    historyService.reset();

    dataSource.update({ ...created, title: 'b' } as any);
    // 此时栈里只有一条 update
    expect(historyService.canUndoDataSource(created.id!)).toBe(true);

    dataSource.undo(created.id!);
    // undo 后栈应可 redo，并且 undo 不应再生新栈记录
    expect(historyService.canRedoDataSource(created.id!)).toBe(true);

    dataSource.redo(created.id!);
    expect(historyService.canRedoDataSource(created.id!)).toBe(false);
    expect(historyService.canUndoDataSource(created.id!)).toBe(true);
  });

  test('canUndo / canRedo 委托给 historyService', () => {
    expect(dataSource.canUndo('ghost')).toBe(false);
    expect(dataSource.canRedo('ghost')).toBe(false);

    const created = dataSource.add({ title: 'a', type: 'base' } as any);
    expect(dataSource.canUndo(created.id!)).toBe(true);
    expect(dataSource.canRedo(created.id!)).toBe(false);

    dataSource.undo(created.id!);
    expect(dataSource.canUndo(created.id!)).toBe(false);
    expect(dataSource.canRedo(created.id!)).toBe(true);
  });

  test('undo - 栈不存在或已无可撤销时返回 null', () => {
    expect(dataSource.undo('ghost')).toBeNull();
    expect(dataSource.redo('ghost')).toBeNull();
  });
});
