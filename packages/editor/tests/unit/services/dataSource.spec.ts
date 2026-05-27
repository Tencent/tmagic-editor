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
});
