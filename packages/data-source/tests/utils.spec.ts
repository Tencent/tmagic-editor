import { describe, expect, test } from 'vitest';

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
