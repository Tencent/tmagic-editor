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

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { HookCodeType, HookType, NodeType } from '@tmagic/core';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX, DATA_SOURCE_SET_DATA_METHOD_NAME } from '@tmagic/utils';

import { ALL_COND_OPS, editorTypeMatchRules } from '@editor/utils/type-match-rules';

const codeDslState = vi.hoisted(() => ({ value: null as Record<string, any> | null }));
const dataSourcesState = vi.hoisted(() => ({ value: [] as any[] }));
const formMethodsState = vi.hoisted(() => ({ value: [] as { label: string; value: string }[] }));
const formEventsState = vi.hoisted(() => ({ value: [] as { label: string; value: string }[] }));
const componentEventsState = vi.hoisted((): { value: Record<string, { label: string; value: string }[]> } => ({
  value: {},
}));
const rootState = vi.hoisted(() => ({ value: null as any }));
const nodesState = vi.hoisted((): { value: Record<string, any> } => ({ value: {} }));

vi.mock('@editor/services/codeBlock', () => ({
  default: {
    getCodeDsl: () => codeDslState.value,
  },
}));

vi.mock('@editor/services/dataSource', () => ({
  default: {
    get: (key: string) => {
      if (key === 'dataSources') return dataSourcesState.value;
      if (key === 'events') return {};
      return undefined;
    },
    getFormMethod: () => formMethodsState.value,
    getFormEvent: () => formEventsState.value,
    getDataSourceById: (id: string) => dataSourcesState.value.find((ds) => `${ds.id}` === `${id}`),
  },
}));

vi.mock('@editor/services/editor', () => ({
  default: {
    get: (key: string) => (key === 'root' ? rootState.value : undefined),
    getNodeById: (id: string | number) => nodesState.value[`${id}`] || null,
  },
}));

vi.mock('@editor/services/events', () => ({
  default: {
    getEvent: (type: string) => componentEventsState.value[type] || [],
  },
}));

const ctx = (config: Record<string, any> = {}, model: Record<string, any> = {}, message?: string) => ({
  fieldType: config.type || '',
  mForm: undefined,
  props: { config, model, prop: config.name || 'field' },
  message,
});

const run = (
  type: string,
  value: any,
  config: Record<string, any> = {},
  model: Record<string, any> = {},
  message?: string,
) => editorTypeMatchRules[type](value, ctx({ ...config, type }, model, message));

describe('editorTypeMatchRules', () => {
  beforeEach(() => {
    codeDslState.value = null;
    dataSourcesState.value = [];
    formMethodsState.value = [];
    formEventsState.value = [];
    componentEventsState.value = {};
    rootState.value = null;
    nodesState.value = {};
  });

  test('key-value / style-setter 形态校验', () => {
    expect(run('key-value', { a: '1' })).toBeUndefined();
    expect(run('key-value', [])).toBe('值类型应为对象');
    expect(run('key-value', () => 1, { advanced: true })).toBeUndefined();
    expect(run('style-setter', { width: '1px' })).toBeUndefined();
    expect(run('style-setter', [])).toBe('值类型应为对象');
  });

  test('cond-op-select 按字段类型收窄，未知类型用默认全集', () => {
    expect(run('cond-op-select', 1)).toBe('值类型应为字符串');
    expect(run('cond-op-select', '=')).toBeUndefined();
    expect(ALL_COND_OPS.has('between')).toBe(true);
    expect(ALL_COND_OPS.has('is')).toBe(true);

    dataSourcesState.value = [
      {
        id: 'ds1',
        type: 'base',
        fields: [
          { name: 'age', type: 'number' },
          { name: 'flag', type: 'boolean' },
        ],
        methods: [],
      },
    ];
    expect(run('cond-op-select', '>', {}, { field: ['ds1', 'age'] })).toBeUndefined();
    expect(run('cond-op-select', 'include', {}, { field: ['ds1', 'age'] })).toBe('include 不在可选项中');
    expect(run('cond-op-select', 'is', {}, { field: ['ds1', 'flag'] })).toBeUndefined();
    // 未知类型与 UI 默认选项对齐：不含 boolean ops
    expect(run('cond-op-select', 'is', {}, { field: ['ds1', 'missing'] })).toBe('is 不在可选项中');
    expect(run('cond-op-select', 'include', {}, { field: ['ds1', 'missing'] })).toBeUndefined();
  });

  test('code-select-col 有 DSL 时校验 key', () => {
    expect(run('code-select-col', 1)).toBe('1类型应为字符串');
    expect(run('code-select-col', 'code_1')).toBeUndefined();

    codeDslState.value = { code_1: { name: 'A' } };
    expect(run('code-select-col', 'code_1')).toBeUndefined();
    expect(run('code-select-col', 'missing')).toBe('代码块(missing)不存在');
  });

  test('page-fragment-select / ui-select 校验节点存在性', () => {
    expect(run('page-fragment-select', true)).toBe('true类型应为字符串或数字');
    expect(run('page-fragment-select', 'pf_1')).toBeUndefined();

    rootState.value = {
      items: [
        { id: 'pf_1', type: NodeType.PAGE_FRAGMENT },
        { id: 'page_1', type: NodeType.PAGE },
      ],
    };
    expect(run('page-fragment-select', 'pf_1')).toBeUndefined();
    expect(run('page-fragment-select', 'page_1')).toBe('页面片段(page_1)不存在');

    rootState.value = null;
    expect(run('ui-select', 'node_1')).toBeUndefined();

    rootState.value = { items: [] };
    nodesState.value = { node_1: { id: 'node_1' } };
    expect(run('ui-select', 'node_1')).toBeUndefined();
    expect(run('ui-select', 'missing')).toBe('组件(missing)不存在');
  });

  test('data-source-input 校验模板绑定', () => {
    expect(run('data-source-input', 1)).toBe('1类型应为字符串');
    expect(run('data-source-input', 'plain')).toBeUndefined();
    expect(run('data-source-input', '${ds1.title}')).toBeUndefined();

    dataSourcesState.value = [
      {
        id: 'ds1',
        type: 'base',
        fields: [
          { name: 'title', type: 'string' },
          { name: 'arr', type: 'array', fields: [{ name: 'item', type: 'string' }] },
        ],
        methods: [],
      },
    ];
    expect(run('data-source-input', 'hello ${ds1.title}')).toBeUndefined();
    expect(run('data-source-input', '${ds1.arr[0].item}')).toBeUndefined();
    expect(run('data-source-input', '${missing.title}')).toBe('数据源绑定(${missing.title})不合法');
    expect(run('data-source-input', '${ds1.missing}')).toBe('数据源绑定(${ds1.missing})不合法');
  });

  test('data-source-method-select 校验方法元组', () => {
    expect(run('data-source-method-select', ['ds1'])).toBe('ds1类型应为长度为 2 的字符串数组');
    expect(run('data-source-method-select', ['ds1', 'foo'])).toBeUndefined();

    dataSourcesState.value = [
      {
        id: 'ds1',
        type: 'base',
        fields: [],
        methods: [{ name: 'custom' }],
      },
    ];
    formMethodsState.value = [{ label: '内置', value: 'builtin' }];

    expect(run('data-source-method-select', ['ds1', DATA_SOURCE_SET_DATA_METHOD_NAME])).toBeUndefined();
    expect(run('data-source-method-select', ['ds1', 'builtin'])).toBeUndefined();
    expect(run('data-source-method-select', ['ds1', 'custom'])).toBeUndefined();
    expect(run('data-source-method-select', ['ds1', 'missing'])).toBe('数据源方法(missing)不存在');
    expect(run('data-source-method-select', ['missing', 'custom'])).toBe('数据源(missing)不存在');
  });

  test('data-source-field-select 校验路径与 fieldConfig 跳过', () => {
    expect(run('data-source-field-select', 'x')).toBe('x类型应为字符串数组');
    expect(run('data-source-field-select', 'text-value', { fieldConfig: { type: 'text' } })).toBeUndefined();

    dataSourcesState.value = [
      {
        id: 'ds1',
        type: 'base',
        fields: [
          { name: 'title', type: 'string' },
          { name: 'obj', type: 'object', fields: [{ name: 'a', type: 'number' }] },
        ],
        methods: [],
      },
    ];

    expect(run('data-source-field-select', ['ds1', 'title'], { value: 'key' })).toBeUndefined();
    expect(run('data-source-field-select', [`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}ds1`, 'title'])).toBeUndefined();
    expect(run('data-source-field-select', ['ds1', 'missing'], { value: 'key' })).toBe('值不在可选项中');
    expect(
      run('data-source-field-select', ['title'], {
        dataSourceId: 'ds1',
        dataSourceFieldType: ['number'],
      }),
    ).toBe('值不在可选项中');
    expect(
      run('data-source-field-select', ['obj', 'a'], {
        dataSourceId: 'ds1',
        dataSourceFieldType: ['number'],
      }),
    ).toBeUndefined();
  });

  test('data-source-select id / 对象形态', () => {
    expect(run('data-source-select', { isBindDataSource: true, dataSourceId: 'ds1' })).toBeUndefined();
    expect(run('data-source-select', 'ds1', { value: 'id' })).toBeUndefined();

    dataSourcesState.value = [
      { id: 'ds1', type: 'base', fields: [], methods: [] },
      { id: 'ds2', type: 'http', fields: [], methods: [] },
    ];

    expect(run('data-source-select', 'ds1', { value: 'id' })).toBeUndefined();
    expect(run('data-source-select', 'missing', { value: 'id' })).toBe('missing不在可选项中');
    expect(run('data-source-select', 'ds2', { value: 'id', dataSourceType: 'base' })).toBe('ds2不在可选项中');
    expect(
      run('data-source-select', { isBindDataSource: true, dataSourceId: 'ds1', dataSourceType: 'base' }),
    ).toBeUndefined();
    expect(run('data-source-select', { isBindDataSource: true, dataSourceId: 'ds1', dataSourceType: 'http' })).toBe(
      '[object Object]不在可选项中',
    );
    expect(run('data-source-select', { isBindDataSource: false, dataSourceId: 'ds1' })).toBe(
      '[object Object]类型不合法',
    );
  });

  test('code-select 校验 hookData', () => {
    expect(run('code-select', { hookType: HookType.CODE, hookData: [] })).toBeUndefined();
    expect(run('code-select', { hookType: 'x', hookData: [] })).toBeUndefined();

    codeDslState.value = { code_1: { name: 'A' } };
    dataSourcesState.value = [{ id: 'ds1', type: 'base', fields: [], methods: [{ name: 'custom' }] }];

    expect(
      run('code-select', {
        hookType: HookType.CODE,
        hookData: [{ codeType: HookCodeType.CODE, codeId: 'code_1', params: {} }],
      }),
    ).toBeUndefined();
    // 存在性（codeId 是否在 DSL 中）已下沉到 code-select-col 单元格校验，容器级仅校验结构
    expect(
      run('code-select', {
        hookType: HookType.CODE,
        hookData: [{ codeType: HookCodeType.CODE, codeId: 'missing' }],
      }),
    ).toBeUndefined();
    expect(
      run('code-select', {
        hookType: HookType.CODE,
        hookData: [{ codeType: HookCodeType.DATA_SOURCE_METHOD, codeId: ['ds1', 'custom'] }],
      }),
    ).toBeUndefined();
    // 数据源方法存在性已下沉到 data-source-method-select 单元格校验
    expect(
      run('code-select', {
        hookType: HookType.CODE,
        hookData: [{ codeType: HookCodeType.DATA_SOURCE_METHOD, codeId: ['ds1', 'missing'] }],
      }),
    ).toBeUndefined();
    expect(
      run('code-select', {
        hookType: HookType.CODE,
        hookData: [{ codeType: 'bad', codeId: 'code_1' }],
      }),
    ).toBeUndefined();
    // DATA_SOURCE_METHOD 的 codeId 元组形态仍在容器级校验
    expect(
      run('code-select', {
        hookType: HookType.CODE,
        hookData: [{ codeType: HookCodeType.DATA_SOURCE_METHOD, codeId: 'not-tuple' }],
      }),
    ).toBeUndefined();
  });

  test('容器类浅层结构校验', () => {
    expect(run('data-source-fields', [{ name: 'a', type: 'string' }])).toBeUndefined();
    expect(run('data-source-fields', [{ name: 'a', type: 'oops' }])).toBe('字段类型不合法');
    expect(
      run('data-source-fields', [{ name: 'obj', type: 'object', fields: [{ name: 'child', type: 'number' }] }]),
    ).toBeUndefined();
    expect(run('data-source-fields', [{ name: 'obj', type: 'object', fields: 'bad' }])).toBe('字段项结构不合法');

    expect(
      run('data-source-mocks', [{ title: 'm', enable: true, useInEditor: false, data: { a: 1 } }]),
    ).toBeUndefined();
    expect(run('data-source-mocks', [{ title: 'm', enable: true, useInEditor: false, data: [] }])).toBe(
      'mock 项结构不合法',
    );

    expect(run('data-source-methods', [{ name: 'fn', content: '() => {}', params: [] }])).toBeUndefined();
    expect(run('data-source-methods', [{ name: 'fn', content: 1 }])).toBe('方法项结构不合法');

    expect(run('event-select', [{ name: 'click', actions: [{ actionType: 'comp' }] }])).toBeUndefined();
    expect(run('event-select', [{ name: 'click', to: 'node_1', method: 'show' }])).toBeUndefined();
    expect(run('event-select', [{ name: 'click' }])).toBe('事件项结构不合法');
    expect(run('event-select', [{ name: 'click', actions: [{}] }])).toBe('事件项结构不合法');

    expect(run('display-conds', [{ cond: [{ field: ['ds1', 'title'], op: '=' }] }])).toBeUndefined();
    // op 是否合法、字段路径是否存在已下沉到 cond-op-select / field 单元格校验，容器级仅校验结构
    expect(run('display-conds', [{ cond: [{ field: ['ds1'], op: 'bad' }] }])).toBeUndefined();
    expect(run('display-conds', [{ cond: [{ field: ['ds1', 'missing'], op: '=' }] }])).toBeUndefined();
    expect(run('display-conds', [{ cond: 'bad' }])).toBe('显示条件结构不合法');
    expect(run('display-conds', [{ cond: [{ field: 'bad', op: '=' }] }])).toBe('显示条件结构不合法');
    expect(run('display-conds', [{ cond: [{ field: ['ds1'], op: 1 }] }])).toBe('显示条件结构不合法');
  });

  test('自定义 message 优先', () => {
    expect(run('key-value', [], {}, {}, '自定义错误')).toBe('自定义错误');
  });
});
