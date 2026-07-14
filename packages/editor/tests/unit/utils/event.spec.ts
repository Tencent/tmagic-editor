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

vi.mock('@editor/services/editor', () => ({ default: editorService }));
vi.mock('@editor/services/dataSource', () => ({ default: dataSourceService }));
vi.mock('@editor/services/events', () => ({ default: eventsService }));
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
    editorService.getNodeById.mockReturnValue({ type: 'btn', id: '1' });
    expect(getCompActionOptions('1')).toEqual([{ text: 'open', value: 'open' }]);
  });

  test('getCompActionOptions 无节点返回空', () => {
    editorService.getNodeById.mockReturnValue(null);
    expect(getCompActionOptions('missing')).toEqual([]);
    expect(getCompActionOptions(undefined)).toEqual([]);
  });

  test('getCompActionOptions 页面片容器返回 cascader options', () => {
    editorService.getNodeById.mockReturnValue({ type: 'page-fragment-container', id: '1', pageFragmentId: 'pf1' });
    editorService.get.mockReturnValue({ items: [{ id: 'pf1', items: [{ id: 'c1', type: 'btn', name: 'b' }] }] });
    expect(getCompActionOptions('1')).toEqual([
      {
        label: 'b_c1',
        value: 'c1',
        children: [{ label: 'open', value: 'open' }],
      },
    ]);
  });

  test('getCompActionAllowedValues 枚举合法动作', () => {
    editorService.getNodeById.mockReturnValue({ type: 'btn', id: '1' });
    expect(getCompActionAllowedValues({ src: 'component' }, { to: '1' })).toEqual(new Set(['open']));
  });

  test('getCompActionAllowedValues 自定义 options 返回 null', () => {
    expect(
      getCompActionAllowedValues({ src: 'component', compActionConfig: { options: () => [] } }, { to: '1' }),
    ).toBeNull();
  });

  test('getCompActionAllowedValues 页面片路径用 . 拼接', () => {
    editorService.getNodeById.mockReturnValue({ type: 'page-fragment-container', id: '1', pageFragmentId: 'pf1' });
    editorService.get.mockReturnValue({ items: [{ id: 'pf1', items: [{ id: 'c1', type: 'btn', name: 'b' }] }] });
    expect(getCompActionAllowedValues({ src: 'component' }, { to: '1' })).toEqual(new Set(['c1.open']));
  });

  test('getEventNameAllowedValues / collectEventNameOptionValues', () => {
    expect(getEventNameAllowedValues({ src: 'component' }, { type: 'btn' })).toEqual(new Set(['click']));
    expect(
      getEventNameAllowedValues({ src: 'component', eventNameConfig: { options: [] } }, { type: 'btn' }),
    ).toBeNull();
    expect(collectEventNameOptionValues([{ value: 'a', children: [{ value: 'b' }] }], false)).toEqual(new Set(['a.b']));
  });

  test('getEventNameOptions datasource 追加数据变化', () => {
    dataSourceService.getDataSourceById.mockReturnValue({ fields: [{ name: 'f1' }] });
    const opts = getEventNameOptions('datasource', { type: 'ds', id: 'd1' });
    expect(opts.some((item: any) => item.value === 'ds-field-changed' || item.label === '数据变化')).toBe(true);
  });
});
