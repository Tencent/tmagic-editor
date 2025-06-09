import { describe, expect, test } from 'vitest';

import { dataSourceTemplateRegExp } from '@tmagic/core';

import { compiledCondition, createIteratorContentData, template } from '@data-source/utils';

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
