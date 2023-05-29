import { describe, expect, test } from 'vitest';

import { DataSchema } from '@tmagic/schema';

import * as util from '@data-source/util';

describe('getDefaultValueFromFields', () => {
  test('最简单', () => {
    const fileds = [
      {
        name: 'name',
      },
    ];
    const data = util.getDefaultValueFromFields(fileds);
    expect(data).toHaveProperty('name');
  });

  test('默认值为string', () => {
    const fileds = [
      {
        name: 'name',
        defaultValue: 'name',
      },
    ];
    const data = util.getDefaultValueFromFields(fileds);
    expect(data.name).toBe('name');
  });

  test('type 为 object', () => {
    const fileds: DataSchema[] = [
      {
        type: 'object',
        name: 'name',
      },
    ];
    const data = util.getDefaultValueFromFields(fileds);
    expect(data.name).toEqual({});
  });

  test('type 为 array', () => {
    const fileds: DataSchema[] = [
      {
        type: 'array',
        name: 'name',
      },
    ];
    const data = util.getDefaultValueFromFields(fileds);
    expect(data.name).toEqual([]);
  });

  test('type 为 null', () => {
    const fileds: DataSchema[] = [
      {
        type: 'null',
        name: 'name',
      },
    ];
    const data = util.getDefaultValueFromFields(fileds);
    expect(data.name).toBeNull();
  });

  test('object 嵌套', () => {
    const fileds: DataSchema[] = [
      {
        type: 'object',
        name: 'name',
        fields: [
          {
            name: 'key',
            defaultValue: 'key',
          },
        ],
      },
    ];
    const data = util.getDefaultValueFromFields(fileds);
    expect(data.name.key).toBe('key');
  });
});
