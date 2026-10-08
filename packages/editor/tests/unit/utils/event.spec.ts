/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  collectEventNameOptionValues,
  getCompActionAllowedValues,
  getCompActionOptions,
  getEventNameAllowedValues,
  getEventNameOptions,
  normalizeCompActionValue,
} from '@editor/utils/event';

const { editorService, dataSourceService, eventsService } = vi.hoisted(() => ({
  editorService: {
    get: vi.fn(),
    getNodeById: vi.fn(),
  },
  dataSourceService: {
    getDataSourceById: vi.fn(),
    getFormEvent: vi.fn(() => []),
  },
  eventsService: {
    getEvent: vi.fn(() => [{ label: 'click', value: 'click' }]),
    getMethod: vi.fn(() => [{ label: 'open', value: 'open' }]),
  },
}));

const services = { editorService, dataSourceService, eventsService } as any;

// 不传 services 时使用默认实例（保持历史签名可用）
vi.mock('@editor/services/sdk-instance', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, editorService, dataSourceService, eventsService };
});

vi.mock('@editor/utils/data-source', async () => {
  const actual = await vi.importActual<any>('@editor/utils/data-source');
  return { ...actual, getCascaderOptionsFromFields: vi.fn(() => [{ label: 'f1', value: 'f1' }]) };
});

describe('event utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventsService.getEvent.mockReturnValue([{ label: 'click', value: 'click' }]);
    eventsService.getMethod.mockReturnValue([{ label: 'open', value: 'open' }]);
  });

  test('normalizeCompActionValue 支持字符串与数组', () => {
    expect(normalizeCompActionValue('open')).toBe('open');
    expect(normalizeCompActionValue(['c1', 'open'])).toBe('c1.open');
    expect(normalizeCompActionValue('')).toBe('');
    expect(normalizeCompActionValue(undefined)).toBe('');
  });

  test('getCompActionOptions 普通组件返回 select options', () => {
    const node = { type: 'btn', id: '1' };
    editorService.getNodeById.mockReturnValue(node);
    expect(getCompActionOptions('1', services)).toEqual([{ text: 'open', value: 'open' }]);
    expect(eventsService.getMethod).toHaveBeenCalledWith('btn', { targetId: '1', node });
  });

  test('getCompActionOptions 无节点返回空', () => {
    editorService.getNodeById.mockReturnValue(null);
    expect(getCompActionOptions('missing', services)).toEqual([]);
    expect(getCompActionOptions(undefined, services)).toEqual([]);
  });

  test('getCompActionOptions 页面片容器返回 cascader options', () => {
    const container = { type: 'page-fragment-container', id: '1', pageFragmentId: 'pf1' };
    const child = { id: 'c1', type: 'btn', name: 'b' };
    editorService.getNodeById.mockImplementation((id: string) => (id === '1' ? container : null));
    editorService.get.mockReturnValue({ items: [{ id: 'pf1', items: [child] }] });
    expect(getCompActionOptions('1', services)).toEqual([
      {
        label: 'b_c1',
        value: 'c1',
        children: [{ label: 'open', value: 'open' }],
      },
    ]);
    expect(eventsService.getMethod).toHaveBeenCalledWith('btn', { targetId: 'c1', node: child });
  });

  test('getCompActionAllowedValues 枚举合法动作', () => {
    editorService.getNodeById.mockReturnValue({ type: 'btn', id: '1' });
    expect(getCompActionAllowedValues({ src: 'component' }, { to: '1' }, services)).toEqual(new Set(['open']));
  });

  test('getCompActionAllowedValues 自定义 options 返回 null', () => {
    expect(
      getCompActionAllowedValues({ src: 'component', compActionConfig: { options: () => [] } }, { to: '1' }, services),
    ).toBeNull();
  });

  test('getCompActionAllowedValues 页面片路径用 . 拼接', () => {
    editorService.getNodeById.mockReturnValue({ type: 'page-fragment-container', id: '1', pageFragmentId: 'pf1' });
    editorService.get.mockReturnValue({ items: [{ id: 'pf1', items: [{ id: 'c1', type: 'btn', name: 'b' }] }] });
    expect(getCompActionAllowedValues({ src: 'component' }, { to: '1' }, services)).toEqual(new Set(['c1.open']));
  });

  test('getEventNameAllowedValues / collectEventNameOptionValues', () => {
    expect(getEventNameAllowedValues({ src: 'component' }, { type: 'btn' }, services)).toEqual(new Set(['click']));
    expect(
      getEventNameAllowedValues({ src: 'component', eventNameConfig: { options: [] } }, { type: 'btn' }, services),
    ).toBeNull();
    expect(collectEventNameOptionValues([{ value: 'a', children: [{ value: 'b' }] }], false)).toEqual(new Set(['a.b']));
  });

  test('getEventNameOptions 页面片子节点查找失败时回退 current', () => {
    const formValue = { type: 'page-fragment-container', id: '1', pageFragmentId: 'pf1' };
    const child = { id: 'c1', type: 'btn', name: 'b' };
    editorService.getNodeById.mockReturnValue(null);
    editorService.get.mockReturnValue({
      items: [{ id: 'pf1', name: '页面片', items: [child] }],
    });

    expect(getEventNameOptions('component', formValue, services)).toEqual([
      {
        label: '页面片',
        value: 'pf1',
        children: [{ label: 'click', value: 'click' }],
      },
      {
        label: 'b_c1',
        value: 'c1',
        children: [{ label: 'click', value: 'click' }],
      },
    ]);
    expect(eventsService.getEvent).toHaveBeenCalledWith('btn', { node: child });
  });

  test('getEventNameOptions datasource 追加数据变化', () => {
    dataSourceService.getDataSourceById.mockReturnValue({ fields: [{ name: 'f1' }] });
    const opts = getEventNameOptions('datasource', { type: 'ds', id: 'd1' }, services);
    expect(opts.some((item: any) => item.value === 'ds-field-changed' || item.label === '数据变化')).toBe(true);
  });

  test('不传 services 时使用默认 service 实例（历史签名）', () => {
    editorService.getNodeById.mockReturnValue({ id: '1', type: 'btn' });

    expect(getEventNameOptions('component', { type: 'btn', id: '1' })).toEqual([{ text: 'click', value: 'click' }]);
    expect(getEventNameAllowedValues({ src: 'component' }, { type: 'btn' })).toEqual(new Set(['click']));
    expect(getEventNameAllowedValues()).toBeNull();
    expect(getCompActionOptions('1')).toEqual([{ text: 'open', value: 'open' }]);
    expect(getCompActionAllowedValues({ src: 'component' }, { to: '1' })).toEqual(new Set(['open']));
    expect(getCompActionAllowedValues()).toEqual(new Set());
  });
});
