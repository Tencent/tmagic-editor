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
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { NodeType } from '@tmagic/schema';

import {
  addParamToUrl,
  calculatePercentage,
  compiledCond,
  convertToNumber,
  emptyFn,
  getDefaultValueFromFields,
  getGlobalThis,
  getKeys,
  getKeysArray,
  getNodeInfo,
  IS_DSL_NODE_KEY,
  isArrayIndex,
  isDslNode,
  isNumber,
  isObject,
  isPageFragment,
  isPercentage,
  isPop,
  isValueIncludeDataSource,
  removeDataSourceFieldPrefix,
  setValueByKeyPath,
  sleep,
  traverseNode,
} from '../../src';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '../../src/const';
import {
  addClassName,
  calcValueByFontsize,
  createDiv,
  getDocument,
  getElById,
  getIdFromEl,
  injectStyle,
  removeClassName,
  removeClassNameByClassName,
  setDslDomRelateConfig,
  setIdToEl,
} from '../../src/dom';

describe('basic helpers', () => {
  test('emptyFn 永远返回 undefined', () => {
    expect(emptyFn()).toBeUndefined();
    expect((emptyFn as Function).call({}, 1, 2, 3)).toBeUndefined();
  });

  test('getGlobalThis 返回全局对象', () => {
    const g = getGlobalThis();
    expect(g).toBeDefined();
    // 多次调用返回同一缓存
    expect(getGlobalThis()).toBe(g);
  });

  test('sleep 在指定时间后 resolve', async () => {
    const start = Date.now();
    await sleep(10);
    expect(Date.now() - start).toBeGreaterThanOrEqual(8);
  });

  test('isObject 仅对纯对象返回 true', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
    expect(isObject([])).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject('s')).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(new Date())).toBe(false);
  });

  test('isNumber 同时支持数字与可解析字符串', () => {
    expect(isNumber(1)).toBe(true);
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-1.5)).toBe(true);
    expect(isNumber('1')).toBe(true);
    expect(isNumber('-1.5')).toBe(true);
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber('abc')).toBe(false);
    expect(isNumber('1px')).toBe(false);
  });
});

describe('node 类型判断', () => {
  test('isPop: 不传则为 false', () => {
    expect(isPop(null)).toBe(false);
  });

  test('isPageFragment 仅识别 page-fragment', () => {
    expect(isPageFragment({ id: 1, type: NodeType.PAGE_FRAGMENT })).toBe(true);
    expect(isPageFragment({ id: 1, type: NodeType.PAGE })).toBe(false);
    expect(isPageFragment(undefined)).toBe(false);
    expect(isPageFragment(null)).toBe(false);
  });

  test('isDslNode 默认为 true，手动 false 关闭', () => {
    expect(isDslNode({ type: 'text' } as any)).toBe(true);
    expect(isDslNode({ type: 'text', [IS_DSL_NODE_KEY]: false } as any)).toBe(false);
    expect(isDslNode({ type: 'text', [IS_DSL_NODE_KEY]: true } as any)).toBe(true);
  });
});

describe('百分比与单位', () => {
  test('isPercentage', () => {
    expect(isPercentage('10%')).toBe(true);
    expect(isPercentage('100.5%')).toBe(true);
    expect(isPercentage('10')).toBe(false);
    expect(isPercentage(10)).toBe(false);
  });

  test('calculatePercentage', () => {
    expect(calculatePercentage(200, '50%')).toBe(100);
    expect(calculatePercentage(100, '0%')).toBe(0);
  });

  test('convertToNumber: 数字直接返回', () => {
    expect(convertToNumber(100)).toBe(100);
  });

  test('convertToNumber: 百分比按父值计算', () => {
    expect(convertToNumber('50%', 200)).toBe(100);
  });

  test('convertToNumber: 普通字符串使用 parseFloat', () => {
    expect(convertToNumber('123.45px')).toBeCloseTo(123.45);
  });
});

describe('compiledCond 全部分支', () => {
  test.each([
    ['is', 1, 1, true],
    ['is', 1, 2, false],
    ['not', 1, 2, true],
    ['not', 1, 1, false],
    ['=', 'a', 'a', true],
    ['!=', 'a', 'b', true],
    ['>', 2, 1, true],
    ['>=', 1, 1, true],
    ['<', 1, 2, true],
    ['<=', 1, 1, true],
    ['include', [1, 2], 1, true],
    ['include', 'abc', 'b', true],
    ['not_include', [1, 2], 3, true],
    ['unknown', 1, 1, false],
  ] as const)('op=%s value=%s 应该返回 %s', (op, fieldValue, inputValue, expected) => {
    expect(compiledCond(op, fieldValue, inputValue)).toBe(expected);
  });

  test('between/not_between', () => {
    expect(compiledCond('between', 5, undefined, [1, 10])).toBe(true);
    expect(compiledCond('between', 11, undefined, [1, 10])).toBe(false);
    expect(compiledCond('not_between', 11, undefined, [1, 10])).toBe(true);
    expect(compiledCond('not_between', 5, undefined, [1, 10])).toBe(false);
    expect(compiledCond('between', 5, undefined, [1])).toBe(false);
  });

  test('字符串字段 + undefined 输入会被规范成空字符串', () => {
    expect(compiledCond('is', '', undefined)).toBe(true);
  });
});

describe('getDefaultValueFromFields 边界场景', () => {
  test('没有 type 也没有 defaultValue 时返回 undefined', () => {
    const result = getDefaultValueFromFields([{ name: 'x' }] as any);
    expect(result).toEqual({ x: undefined });
  });

  test('array 类型但 defaultValue 不是数组时退回 []', () => {
    const result = getDefaultValueFromFields([{ name: 'x', type: 'array', defaultValue: 'not-array' }] as any);
    expect(result.x).toEqual([]);
  });

  test('object 类型且 defaultValue 是 JSON 字符串时会被解析', () => {
    const result = getDefaultValueFromFields([{ name: 'x', type: 'object', defaultValue: '{"a":1}' }] as any);
    expect(result.x).toEqual({ a: 1 });
  });

  test('object 类型且 defaultValue 是非法 JSON 字符串时退回 {}', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = getDefaultValueFromFields([{ name: 'x', type: 'object', defaultValue: 'not-json' }] as any);
    expect(result.x).toEqual({});
    warnSpy.mockRestore();
  });

  test('object 类型 defaultValue 既不是对象也不是字符串时退回 {}', () => {
    const result = getDefaultValueFromFields([{ name: 'x', type: 'object', defaultValue: 123 } as any]);
    expect(result.x).toEqual({});
  });

  test('boolean / number 类型默认为 undefined', () => {
    const result = getDefaultValueFromFields([
      { name: 'b', type: 'boolean' },
      { name: 'n', type: 'number' },
    ] as any);
    expect(result).toEqual({ b: undefined, n: undefined });
  });
});

describe('getNodeInfo', () => {
  const root = {
    id: 'app',
    items: [
      {
        id: 'page_1',
        type: NodeType.PAGE,
        items: [{ id: 'btn_1', type: 'button' }],
      },
    ],
  } as any;

  test('id 等于 root.id 时返回 root 自身', () => {
    const info = getNodeInfo('app', root);
    expect(info.node).toBe(root);
  });

  test('找到子节点时同时返回 parent 和 page', () => {
    const info = getNodeInfo('btn_1', root);
    expect(info.node?.id).toBe('btn_1');
    expect(info.parent?.id).toBe('page_1');
    expect(info.page?.id).toBe('page_1');
  });

  test('未找到节点时返回空 info', () => {
    const info = getNodeInfo('not-exist', root);
    expect(info.node).toBeNull();
    expect(info.parent).toBeNull();
  });

  test('root 为 null 时返回空 info', () => {
    const info = getNodeInfo('foo', null);
    expect(info.node).toBeNull();
  });

  test('skip 跳过指定页面子树后查找不到其内部节点', () => {
    const multiRoot = {
      id: 'app',
      items: [
        { id: 'page_1', type: NodeType.PAGE, items: [{ id: 'btn_1', type: 'button' }] },
        { id: 'page_2', type: NodeType.PAGE, items: [{ id: 'btn_2', type: 'button' }] },
      ],
    } as any;

    // 跳过 page_1 后，page_1 内的节点查不到
    const skipped = getNodeInfo('btn_1', multiRoot, multiRoot.items[0]);
    expect(skipped.node).toBeNull();

    // 其它页面节点不受影响，parent / page 仍为真实引用
    const info = getNodeInfo('btn_2', multiRoot, multiRoot.items[0]);
    expect(info.node?.id).toBe('btn_2');
    expect(info.parent?.id).toBe('page_2');
    expect(info.page?.id).toBe('page_2');
    expect(info.parent).toBe(multiRoot.items[1]);
  });
});

describe('setValueByKeyPath / getKeys', () => {
  test('setValueByKeyPath 设置嵌套值', () => {
    const obj: any = {};
    setValueByKeyPath('a.b.c', 1, obj);
    expect(obj.a.b.c).toBe(1);
  });

  test('setValueByKeyPath 当 value 为 undefined 时不写入 undefined 到数组', () => {
    const obj: any = {};
    setValueByKeyPath('displayConds.0.cond.0', undefined, obj);
    expect(obj).toEqual({ displayConds: [{ cond: [] }] });
  });

  test('setValueByKeyPath 当 value 为 undefined 时保留已有父级数据', () => {
    const obj: any = { displayConds: [{ cond: ['x'] }] };
    setValueByKeyPath('displayConds.0.cond.1', undefined, obj);
    expect(obj).toEqual({ displayConds: [{ cond: ['x'] }] });
  });

  test('setValueByKeyPath 对象属性 value 为 undefined 时保持原行为', () => {
    const obj: any = {};
    setValueByKeyPath('a.b.c', undefined, obj);
    expect(obj.a.b.c).toBeUndefined();
  });

  test('setValueByKeyPath 末级为数字 key 且父级已存在但非数组时不覆盖父级', () => {
    const obj: any = { displayConds: [{ cond: 'not-array' }] };
    setValueByKeyPath('displayConds.0.cond.0', undefined, obj);
    // 父级非数组时跳过补建，保留原值
    expect(obj).toEqual({ displayConds: [{ cond: 'not-array' }] });
  });

  test('setValueByKeyPath 数字型末级 key 统一按数组下标处理（数字型对象 key 歧义）', () => {
    const obj: any = { map: { 0: 'a' } };
    setValueByKeyPath('map.0', undefined, obj);
    // map 已存在，直接返回，不会把 map['0'] 置为 undefined
    expect(obj).toEqual({ map: { 0: 'a' } });
  });

  test('isArrayIndex 仅对纯数字返回 true', () => {
    expect(isArrayIndex(0)).toBe(true);
    expect(isArrayIndex('0')).toBe(true);
    expect(isArrayIndex('12')).toBe(true);
    expect(isArrayIndex('a')).toBe(false);
    expect(isArrayIndex('1a')).toBe(false);
    expect(isArrayIndex('')).toBe(false);
  });

  test('getKeys 返回对象 keys', () => {
    const obj: { a: number; b: number } = { a: 1, b: 2 };
    expect(getKeys(obj)).toEqual(['a', 'b']);
  });
});

describe('traverseNode', () => {
  test('深度优先遍历，记录 parents', () => {
    const tree = {
      id: 1,
      items: [{ id: 2, items: [{ id: 4 }] }, { id: 3 }],
    };
    const visited: Array<{ id: number; depth: number }> = [];
    traverseNode<any>(tree, (node, parents) => {
      visited.push({ id: node.id, depth: parents.length });
    });
    expect(visited).toEqual([
      { id: 1, depth: 0 },
      { id: 2, depth: 1 },
      { id: 4, depth: 2 },
      { id: 3, depth: 1 },
    ]);
  });

  test('evalCbAfter=true 时回调在子节点之后执行', () => {
    const tree = { id: 1, items: [{ id: 2 }] };
    const order: number[] = [];
    traverseNode<any>(tree, (node) => order.push(node.id), [], true);
    expect(order).toEqual([2, 1]);
  });
});

describe('isValueIncludeDataSource & removeDataSourceFieldPrefix', () => {
  test('字符串模板包含数据源', () => {
    expect(isValueIncludeDataSource('hello ${ds.field}')).toBe(true);
    expect(isValueIncludeDataSource('hello world')).toBe(false);
  });

  test('数组首项以前缀开头时识别为数据源', () => {
    expect(isValueIncludeDataSource([`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}foo`, 'bar'])).toBe(true);
  });

  test('对象 isBindDataSource(Field) + dataSourceId 时识别为数据源', () => {
    expect(isValueIncludeDataSource({ isBindDataSource: true, dataSourceId: 'ds_1' })).toBe(true);
    expect(isValueIncludeDataSource({ isBindDataSourceField: true, dataSourceId: 'ds_1' })).toBe(true);
    expect(isValueIncludeDataSource({ isBindDataSource: true })).toBe(false);
  });

  test('removeDataSourceFieldPrefix', () => {
    expect(removeDataSourceFieldPrefix(`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}foo.bar`)).toBe('foo.bar');
    expect(removeDataSourceFieldPrefix(undefined)).toBe('');
    expect(removeDataSourceFieldPrefix('plain')).toBe('plain');
  });
});

describe('getKeysArray 数字输入', () => {
  test('数字 0 应转为 ["0"]', () => {
    expect(getKeysArray(0)).toEqual(['0']);
  });
});

describe('addParamToUrl', () => {
  beforeEach(() => {
    if (typeof globalThis.window === 'undefined') {
      // jsdom 环境下默认有 window，这里防御性补全
      (globalThis as any).window = globalThis;
    }
  });

  test('needReload=false 时调用 history.pushState', () => {
    const pushState = vi.fn();
    const fakeGlobal: any = {
      location: { href: 'http://example.com/a?b=1' },
      history: { pushState },
    };
    addParamToUrl({ b: '2', c: '3' }, fakeGlobal, false);
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(fakeGlobal.location.href).toBe('http://example.com/a?b=1');
  });

  test('needReload=true 时直接修改 location.href', () => {
    const fakeGlobal: any = {
      location: { href: 'http://example.com/' },
      history: { pushState: vi.fn() },
    };
    addParamToUrl({ b: '1' }, fakeGlobal, true);
    expect(fakeGlobal.location.href).toContain('b=1');
  });
});

describe('dom helpers', () => {
  let doc: Document;

  beforeEach(() => {
    if (typeof globalThis.document === 'undefined') return;
    doc = globalThis.document;
    doc.body.innerHTML = '';
  });

  test('addClassName / removeClassName', () => {
    if (!doc) return;
    const a = doc.createElement('div');
    const b = doc.createElement('div');
    doc.body.appendChild(a);
    doc.body.appendChild(b);

    addClassName(a, doc, 'active');
    expect(a.classList.contains('active')).toBe(true);

    addClassName(b, doc, 'active');
    expect(a.classList.contains('active')).toBe(false);
    expect(b.classList.contains('active')).toBe(true);

    removeClassName(b, 'active');
    expect(b.classList.contains('active')).toBe(false);
  });

  test('removeClassNameByClassName', () => {
    if (!doc) return;
    const a = doc.createElement('div');
    a.classList.add('x');
    doc.body.appendChild(a);
    const removed = removeClassNameByClassName(doc, 'x');
    expect(removed).toBe(a);
    expect(a.classList.contains('x')).toBe(false);
    expect(removeClassNameByClassName(doc, 'not-exist')).toBeNull();
  });

  test('injectStyle 创建 style 节点', () => {
    if (!doc) return;
    const styleEl = injectStyle(doc, '.a { color: red; }');
    expect(styleEl.tagName.toLowerCase()).toBe('style');
    expect(styleEl.innerHTML).toContain('color: red');
  });

  test('createDiv 设置 className 与 cssText', () => {
    if (!doc) return;
    const el = createDiv({ className: 'foo', cssText: 'width: 1px;' });
    expect(el.className).toBe('foo');
    expect(el.style.width).toBe('1px');
  });

  test('getDocument 返回全局 document', () => {
    expect(getDocument()).toBe(globalThis.document);
  });

  test('calcValueByFontsize: 没有 doc 时直接返回 value', () => {
    expect(calcValueByFontsize(undefined as any, 100)).toBe(100);
  });

  test('calcValueByFontsize: documentElement.fontSize 设置时按比例换算', () => {
    if (!doc) return;
    doc.documentElement.style.fontSize = '50px';
    expect(calcValueByFontsize(doc, 100)).toBeCloseTo(200);
    doc.documentElement.style.fontSize = '';
  });

  test('calcValueByFontsize: 没有 fontSize 时直接返回原值', () => {
    if (!doc) return;
    doc.documentElement.style.fontSize = '';
    expect(calcValueByFontsize(doc, 42)).toBe(42);
  });

  test('dslDomRelateConfig get/set/getId', () => {
    if (!doc) return;
    const div = doc.createElement('div');
    setIdToEl()(div, 'node-1');
    expect(getIdFromEl()(div)).toBe('node-1');

    doc.body.appendChild(div);
    expect(getElById()(doc, 'node-1')).toBe(div);

    const customGetId = (el?: HTMLElement | SVGElement | null) => `custom-${el?.id ?? 'none'}`;
    setDslDomRelateConfig('getIdFromEl', customGetId);
    expect(getIdFromEl()(div)).toBe('custom-');
    setDslDomRelateConfig('getIdFromEl', (el?: HTMLElement | SVGElement | null) => el?.dataset?.tmagicId);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
