/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';

import {
  getCascaderOptionsFromFields,
  getDisplayField,
  getFieldType,
  getFormConfig,
  getFormValue,
  resolveFieldByPath,
} from '@editor/utils/data-source';

describe('data-source utils', () => {
  test('getFormConfig - base 类型', () => {
    const cfg = getFormConfig('base', {});
    expect(Array.isArray(cfg)).toBe(true);
  });

  test('getFormConfig - http 类型', () => {
    const cfg = getFormConfig('http', {});
    expect(Array.isArray(cfg)).toBe(true);
  });

  test('getFormConfig - 未知类型走自定义 configs', () => {
    const cfg = getFormConfig('custom', { custom: [{ name: 'foo' }] as any });
    expect(Array.isArray(cfg)).toBe(true);
  });

  test('getFormValue - 非 http 直接返回', () => {
    const result = getFormValue('base', { id: '1' } as any);
    expect(result).toEqual({ id: '1' });
  });

  test('getFormValue - http 类型时附带 beforeRequest/afterResponse 模板', () => {
    const result = getFormValue('http', { id: '1' } as any) as any;
    expect(result.beforeRequest).toContain('return options');
    expect(result.afterResponse).toContain('return response');
  });

  test('getDisplayField 解析模板', () => {
    const dsList = [
      {
        id: 'ds_1',
        title: '数据源1',
        fields: [{ name: 'name', title: '名称' }],
      },
    ] as any;
    const segs = getDisplayField(dsList, 'hello ${ds_1.name} world');
    expect(segs[0]).toEqual({ type: 'text', value: 'hello ' });
    expect(segs[1]).toEqual({ type: 'var', value: '数据源1.名称' });
    expect(segs[2]).toEqual({ type: 'text', value: ' world' });
  });

  test('getDisplayField 数字索引', () => {
    const segs = getDisplayField([{ id: 'ds', title: 'D', fields: [{ name: 'arr' }] }] as any, '${ds.arr[0]}');
    const varSeg = segs.find((s) => s.type === 'var');
    expect(varSeg?.value).toBe('D.arr[0]');
  });

  test('getDisplayField 无模板时返回单段 text', () => {
    const segs = getDisplayField([], 'plain');
    expect(segs).toEqual([{ type: 'text', value: 'plain' }]);
  });

  test('getCascaderOptionsFromFields 默认包含所有类型', () => {
    const fields: any = [
      { name: 'a', type: 'string' },
      { name: 'b', type: 'object', fields: [{ name: 'b1', type: 'string' }] },
    ];
    const opts = getCascaderOptionsFromFields(fields);
    expect(opts).toHaveLength(2);
    expect(opts[1].children).toHaveLength(1);
  });

  test('getCascaderOptionsFromFields 过滤指定 fieldType', () => {
    const fields: any = [
      { name: 'a', type: 'number' },
      { name: 'b', type: 'string' },
    ];
    const opts = getCascaderOptionsFromFields(fields, ['number']);
    expect(opts.map((o) => o.value)).toEqual(['a']);
  });

  test('resolveFieldByPath 沿 path 下钻', () => {
    const fields: any = [
      {
        name: 'obj',
        type: 'object',
        fields: [{ name: 'name', type: 'string' }],
      },
      {
        name: 'arr',
        type: 'array',
        fields: [{ name: 'item', type: 'number' }],
      },
    ];

    expect(resolveFieldByPath(fields, ['obj', 'name'])).toMatchObject({
      ok: true,
      field: { name: 'name', type: 'string' },
      fields: [],
    });
    expect(resolveFieldByPath(fields, ['obj']).field?.name).toBe('obj');
    expect(resolveFieldByPath(fields, ['unknown'])).toEqual({ ok: false, fields });
    expect(resolveFieldByPath(undefined, ['x'])).toEqual({ ok: false, fields: [] });
    expect(resolveFieldByPath(fields, []).ok).toBe(true);
  });

  test('resolveFieldByPath 可跳过数字下标', () => {
    const fields: any = [
      {
        name: 'arr',
        type: 'array',
        fields: [{ name: 'item', type: 'number', fields: [{ name: 'n', type: 'string' }] }],
      },
    ];

    const result = resolveFieldByPath(fields, ['arr', '0', 'item'], { skipNumberIndices: true });
    expect(result.ok).toBe(true);
    expect(result.field?.name).toBe('item');
    expect(result.fields).toEqual([{ name: 'n', type: 'string' }]);

    expect(resolveFieldByPath(fields, ['arr', '0', 'missing'], { skipNumberIndices: true }).ok).toBe(false);
  });

  test('getFieldType 沿 path 取最终类型', () => {
    const ds: any = {
      fields: [{ name: 'obj', type: 'object', fields: [{ name: 'name', type: 'string' }] }],
    };
    expect(getFieldType(ds, ['obj', 'name'])).toBe('string');
    expect(getFieldType(ds, ['obj'])).toBe('object');
    expect(getFieldType(ds, ['unknown'])).toBe('');
    expect(getFieldType(undefined, ['x'])).toBe('');
  });

  test('getFormConfig - 内部 tab 配置 defaultValue/display 函数行为', () => {
    const cfg = getFormConfig('http', {}) as any[];
    // 从尾部找到 tab 节点 (TabConfig)
    const tab = cfg[cfg.length - 1];
    const items = tab.items as any[];

    // 数据定义 / 方法定义 / mock 数据 等 tab 的 defaultValue 应返回 []
    items.forEach((tabItem) => {
      tabItem.items.forEach((field: any) => {
        if (typeof field.defaultValue === 'function') {
          expect(field.defaultValue()).toEqual([]);
        }
      });
    });

    // 请求参数裁剪 / 响应数据裁剪 仅当 model.type === 'http' 时显示
    const trimTabs = items.filter((t: any) => typeof t.display === 'function');
    expect(trimTabs.length).toBeGreaterThan(0);
    trimTabs.forEach((t: any) => {
      expect(t.display({}, { model: { type: 'http' } })).toBe(true);
      expect(t.display({}, { model: { type: 'base' } })).toBe(false);
    });
  });

  test('getDisplayField match.index 为 undefined 时跳出', () => {
    const segs = getDisplayField([], '');
    expect(segs).toEqual([]);
  });

  test('getDisplayField 数据源/字段未命中走 fallback', () => {
    const segs = getDisplayField([], '${unknown.foo}');
    const varSeg = segs.find((s) => s.type === 'var');
    expect(varSeg?.value).toBe('unknown.foo');
  });

  test('getCascaderOptionsFromFields - 子字段命中时父级也保留', () => {
    const fields: any = [
      {
        name: 'obj',
        type: 'object',
        fields: [{ name: 'inner', type: 'number' }],
      },
    ];
    const opts = getCascaderOptionsFromFields(fields, ['number']);
    expect(opts).toHaveLength(1);
    expect(opts[0].children).toHaveLength(1);
  });

  test('getCascaderOptionsFromFields - 空数组及 undefined 字段类型默认 any', () => {
    const fields: any = [{ name: 'a' }];
    const opts = getCascaderOptionsFromFields(fields, []);
    expect(opts).toHaveLength(1);
  });

  test('getFieldType - 第二层 fields 缺失提前返回', () => {
    const ds: any = { fields: [{ name: 'a', type: 'string' }] };
    expect(getFieldType(ds, ['a', 'b'])).toBe('');
  });
});
