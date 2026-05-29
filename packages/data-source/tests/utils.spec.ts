import { describe, expect, test, vi } from 'vitest';

import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX, dataSourceTemplateRegExp, NodeType } from '@tmagic/core';

import {
  compiledCondition,
  compiledNodeField,
  compliedConditions,
  compliedDataSourceField,
  compliedIteratorItem,
  createIteratorContentData,
  registerDataSourceOnDemand,
  template,
  updateNode,
} from '@data-source/utils';

describe('compiledCondition', () => {
  test('=,true', () => {
    const result = compiledCondition(
      [
        {
          field: ['a', 'b'],
          op: '=',
          value: 1,
        },
      ],
      { a: { b: 1 } },
    );

    expect(result).toBeTruthy();
  });

  test('=,false', () => {
    const result = compiledCondition(
      [
        {
          field: ['a', 'b'],
          op: '=',
          value: 2,
        },
      ],
      { a: { b: 1 } },
    );

    expect(result).toBeFalsy();
  });
});

describe('template', () => {
  test('template', () => {
    const value = template('xxx${aa.bb}123${aa1.bb1}dsf', { aa: { bb: 1 }, aa1: { bb1: 2 } });
    expect(value).toBe('xxx11232dsf');
  });

  // 测试1: 普通字符串，没有模板变量
  test('should return original string when no template variables', () => {
    const value = 'This is a plain text';
    const result = template(value);
    expect(result).toBe(value);
  });

  // 测试2: 包含模板变量但未提供数据源
  test('should keep template variables when no data provided', () => {
    const value = 'Hello ${user.name}';
    const result = template(value);
    expect(result).toBe(value);
  });

  // 测试3: 包含模板变量且数据源中有对应值
  test('should replace template variables with data source values', () => {
    const value = 'Hello ${user.name}, your age is ${user.age}';
    const data = {
      user: {
        name: 'John',
        age: 30,
      },
    };
    const result = template(value, data);
    expect(result).toBe('Hello John, your age is 30');
  });

  // 测试4: 模板变量在数据源中不存在
  test('should keep template variables when path not found in data', () => {
    const value = 'Hello ${user.name}, your job is ${user.job}';
    const data = {
      user: {
        name: 'John',
      },
    };
    const result = template(value, data);
    expect(result).toBe('Hello John, your job is undefined');
  });

  // 测试5: 多层嵌套的数据源路径
  test('should handle deeply nested data paths', () => {
    const value = 'User info: ${user.personal.details.address.city}';
    const data = {
      user: {
        personal: {
          details: {
            address: {
              city: 'Beijing',
            },
          },
        },
      },
    };
    const result = template(value, data);
    expect(result).toBe('User info: Beijing');
  });

  // 测试6: 多个模板变量混合的情况
  test('should handle multiple template variables mixed with text', () => {
    const value = 'User: ${user.name}, Age: ${user.age}, Score: ${user.score}';
    const data = {
      user: {
        name: 'Alice',
        age: 25,
        score: 95,
      },
    };
    const result = template(value, data);
    expect(result).toBe('User: Alice, Age: 25, Score: 95');
  });

  // 测试7: 数据源为 undefined 或 null
  test('should handle undefined or null data source', () => {
    const value = 'Test ${some.value}';

    // 测试 undefined
    const result1 = template(value, undefined);
    expect(result1).toBe(value);

    // 测试 null
    const result2 = template(value, null as any);
    expect(result2).toBe(value);
  });

  // 测试8: 空字符串输入
  test('should handle empty string input', () => {
    const value = '';
    const result = template(value);
    expect(result).toBe('');
  });

  // 测试9: 正则表达式匹配测试
  test('should correctly match template patterns', () => {
    // 测试正则表达式是否能正确匹配模板变量
    const testString = '${a.b.c} ${x.y.z}';
    const matches = testString.match(dataSourceTemplateRegExp);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBeGreaterThan(0);
  });

  // 测试10: 复杂混合情况
  test('should handle complex mixed cases', () => {
    const value = 'User: ${user.name}, ${user.age} years old. ${not.found} ${user.address.city}';
    const data = {
      user: {
        name: 'Bob',
        age: 40,
        address: {
          city: 'Shanghai',
        },
      },
    };
    const result = template(value, data);
    expect(result).toBe('User: Bob, 40 years old. ${not.found} Shanghai');
  });
});

describe('createIteratorContentData', () => {
  test('createIteratorContentData', () => {
    const ctxData: any = createIteratorContentData({ b: 1 }, 'ds', ['a'], { ds: { a: [{ b: 1 }] } });
    expect(ctxData.ds.a.b).toBe(1);
  });
  test('混用', () => {
    const ctxData: any = createIteratorContentData({ b: 1 }, 'ds', ['a'], { ds: { a: [{ b: 1 }], b: 2 } });
    expect(ctxData.ds.b).toBe(2);
  });

  test('二维数组', () => {
    const ctxData: any = createIteratorContentData({ a: 1 }, 'ds', ['a', 'c'], {
      ds: {
        a: [
          {
            b: 0,
            c: [{ a: 1 }],
          },
        ],
        b: 2,
      },
    });
    expect(ctxData.ds.a.c.a).toBe(1);
  });
});

describe('compliedConditions', () => {
  test('未配置 conditions 时直接返回 true', () => {
    expect(compliedConditions({}, {})).toBe(true);
    expect(compliedConditions({ ['displayConds' as any]: [] } as any, {})).toBe(true);
  });

  test('任一 cond 通过即返回 true', () => {
    const node: any = {
      displayConds: [
        { cond: [{ field: ['ds_1', 'a'], op: '=', value: 2 }] },
        { cond: [{ field: ['ds_1', 'a'], op: '=', value: 1 }] },
      ],
    };
    expect(compliedConditions(node, { ds_1: { a: 1 } })).toBe(true);
  });

  test('全部不通过则返回 false', () => {
    const node: any = {
      displayConds: [{ cond: [{ field: ['ds_1', 'a'], op: '=', value: 2 }] }],
    };
    expect(compliedConditions(node, { ds_1: { a: 1 } })).toBe(false);
  });

  test('cond 为空被跳过', () => {
    const node: any = { displayConds: [{ cond: undefined }] };
    expect(compliedConditions(node, {})).toBe(false);
  });
});

describe('compiledCondition 边界', () => {
  test('数据源不存在时直接 break 视为通过', () => {
    expect(compiledCondition([{ field: ['unknown', 'a'], op: '=', value: 1 }], {})).toBe(true);
  });

  test('field 取值异常（如类型错）时 console.warn 不阻断', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = compiledCondition([{ field: ['ds', 'a', 'b', 'c'], op: '=', value: 1 }], { ds: { a: 'string' } });
    expect(result).toBe(true);
    warn.mockRestore();
  });
});

describe('updateNode', () => {
  test('页面节点直接替换 dsl.items', () => {
    const dsl: any = {
      type: NodeType.ROOT,
      id: 'app',
      items: [{ id: 'p1', type: NodeType.PAGE, items: [{ id: 'btn' }] }],
    };
    updateNode({ id: 'p1', type: NodeType.PAGE, items: [{ id: 'btn2' }] } as any, dsl);
    expect(dsl.items[0].items[0].id).toBe('btn2');
  });

  test('非页面节点走 replaceChildNode', () => {
    const dsl: any = {
      type: NodeType.ROOT,
      id: 'app',
      items: [
        {
          id: 'p1',
          type: NodeType.PAGE,
          items: [{ id: 'btn', type: 'button', text: 'old' }],
        },
      ],
    };
    updateNode({ id: 'btn', type: 'button', text: 'new' } as any, dsl);
    expect(dsl.items[0].items[0].text).toBe('new');
  });
});

describe('compliedDataSourceField', () => {
  test('不带前缀直接返回原值', () => {
    expect(compliedDataSourceField(['no-prefix-id', 'name'], { id: { name: 'x' } })).toEqual(['no-prefix-id', 'name']);
  });

  test('数据源不存在时返回原值', () => {
    expect(compliedDataSourceField([`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}id`, 'name'], {})).toEqual([
      `${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}id`,
      'name',
    ]);
  });

  test('正常解析数据源字段', () => {
    const value = compliedDataSourceField([`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}id`, 'name'], {
      id: { name: 'x' },
    });
    expect(value).toBe('x');
  });

  test('字段路径不存在时返回原值', () => {
    expect(
      compliedDataSourceField([`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}id`, 'name', 'sub'], { id: { name: 'x' } }),
    ).toEqual([`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}id`, 'name', 'sub']);
  });
});

describe('compiledNodeField', () => {
  const data = { id: { name: 'world' } };

  test('字符串模板', () => {
    expect(compiledNodeField('hello ${id.name}', data)).toBe('hello world');
  });

  test('isBindDataSource 直接取整个数据源', () => {
    expect(compiledNodeField({ isBindDataSource: true, dataSourceId: 'id' }, data)).toEqual({ name: 'world' });
  });

  test('isBindDataSourceField 走模板', () => {
    expect(compiledNodeField({ isBindDataSourceField: true, dataSourceId: 'id', template: 'hi ${name}' }, data)).toBe(
      'hi world',
    );
  });

  test('数组形式走 compliedDataSourceField', () => {
    expect(compiledNodeField([`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}id`, 'name'], data)).toBe('world');
  });

  test('未匹配格式直接返回原值', () => {
    expect(compiledNodeField(123 as any, data)).toBe(123);
  });
});

describe('compliedIteratorItem', () => {
  test('递归 compile items 并应用条件', () => {
    const item: any = {
      id: 'parent',
      items: [{ id: 'child', text: 'origin' }],
    };
    const ctxData = { ds: { name: 'V' } };
    const result = compliedIteratorItem({
      compile: (v: any) => `compiled-${v}`,
      dsId: 'ds',
      item,
      deps: { child: { name: 'c', keys: ['text'] } },
      condDeps: {},
      inEditor: false,
      ctxData,
    });
    expect(result.items[0].text).toBe('compiled-origin');
    expect(result.id).toBe('parent');
  });

  test('items 不是数组时保留原值', () => {
    const result = compliedIteratorItem({
      compile: (v: any) => v,
      dsId: 'ds',
      item: { id: 'p', items: 'not-array' as any } as any,
      deps: {},
      condDeps: {},
      inEditor: true,
      ctxData: {},
    });
    expect(result.items).toBe('not-array');
  });

  test('条件依赖在非编辑器中会写入 condResult', () => {
    const result = compliedIteratorItem({
      compile: (v: any) => v,
      dsId: 'ds',
      item: {
        id: 'p',
        displayConds: [{ cond: [{ field: ['ds', 'a'], op: '=', value: 1 }] }],
      } as any,
      deps: {},
      condDeps: { p: { name: 'p', keys: ['displayConds'] } },
      inEditor: false,
      ctxData: { ds: { a: 1 } },
    });
    expect(result.condResult).toBe(true);
  });
});

describe('registerDataSourceOnDemand', () => {
  test('按依赖按需返回模块', async () => {
    const dsl: any = {
      dataSources: [
        { id: 'a', type: 'http' },
        { id: 'b', type: 'mock' },
        { id: 'c', type: 'http' },
      ],
      dataSourceDeps: { a: { node1: { name: 'n', keys: ['x'] } } },
      dataSourceCondDeps: { c: { node2: { name: 'n', keys: ['y'] } } },
      dataSourceMethodDeps: {},
    };
    const httpModule = { default: class HttpDS {} };
    const mockModule = { default: class MockDS {} };
    const modules = await registerDataSourceOnDemand(dsl, {
      http: () => Promise.resolve(httpModule as any),
      mock: () => Promise.resolve(mockModule as any),
    });
    expect(modules.http).toBe(httpModule.default);
    expect(modules.mock).toBeUndefined();
  });

  test('找不到对应模块时跳过', async () => {
    const dsl: any = {
      dataSources: [{ id: 'a', type: 'unknown' }],
      dataSourceDeps: { a: { node: { name: 'n', keys: ['x'] } } },
    };
    const modules = await registerDataSourceOnDemand(dsl, {});
    expect(Object.keys(modules)).toHaveLength(0);
  });
});
