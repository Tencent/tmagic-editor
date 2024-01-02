import { describe, expect, test } from 'vitest';

import { DataSource } from '@data-source/index';

describe('DataSource', () => {
  test('instance', () => {
    const ds = new DataSource({
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
      },
      app: {},
    });

    expect(ds).toBeInstanceOf(DataSource);
    expect(ds.data).toHaveProperty('name');
  });

  test('init', () => {
    const ds = new DataSource({
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
      },
      app: {},
    });

    ds.init();

    expect(ds.isInit).toBeTruthy();
  });
});

describe('DataSource setData', () => {
  test('setData', () => {
    const ds = new DataSource({
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name', defaultValue: 'name' }],
        methods: [],
      },
      app: {},
    });

    ds.init();

    expect(ds.data.name).toBe('name');

    ds.setData({ name: 'name2' });

    expect(ds.data.name).toBe('name2');

    ds.setData('name3', 'name');

    expect(ds.data.name).toBe('name3');
  });

  test('setDataByPath', () => {
    const ds = new DataSource({
      schema: {
        type: 'base',
        id: '1',
        fields: [
          { name: 'name', defaultValue: 'name' },
          {
            name: 'obj',
            type: 'object',
            fields: [{ name: 'a' }, { name: 'b', type: 'array', fields: [{ name: 'c' }] }],
          },
        ],
        methods: [],
      },
      app: {},
    });

    ds.init();

    expect(ds.data.name).toBe('name');
    expect(ds.data.obj.b).toHaveLength(0);

    ds.setData({
      name: 'name',
      obj: {
        a: 'a',
        b: [
          {
            c: 'c',
          },
        ],
      },
    });

    expect(ds.data.obj.b).toHaveLength(1);
    expect(ds.data.obj.b[0].c).toBe('c');

    ds.setData('c1', 'obj.b.0.c');
    expect(ds.data.obj.b[0].c).toBe('c1');
    expect(ds.data.obj.a).toBe('a');
    ds.setData('a1', 'obj.a');
    expect(ds.data.obj.a).toBe('a1');
  });
});
