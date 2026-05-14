/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import componentList from '@editor/services/componentList';

afterEach(() => {
  componentList.resetState();
  vi.clearAllMocks();
});

describe('ComponentList service', () => {
  test('setList / getList 写入与读取', () => {
    const list = [{ title: 'a', items: [] }] as any;
    componentList.setList(list);
    expect(componentList.getList()).toBe(list);
  });

  test('resetState 清空 list', () => {
    componentList.setList([{ title: 'b', items: [] }] as any);
    componentList.resetState();
    expect(componentList.getList()).toEqual([]);
  });

  test('destroy 清空状态与监听', () => {
    const fn = vi.fn();
    componentList.on('test', fn);
    componentList.setList([{ title: 'c', items: [] }] as any);
    componentList.destroy();
    expect(componentList.getList()).toEqual([]);
    componentList.emit('test');
    expect(fn).not.toHaveBeenCalled();
  });
});
