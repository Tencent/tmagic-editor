import { describe, expect, test, vi } from 'vitest';

import App from '@tmagic/core';

import { DataSource } from '@data-source/index';
import { DeepObservedData } from '@data-source/observed-data';

describe('DataSource', () => {
  test('instance', () => {
    const ds = new DataSource({
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
      },
      app: new App({}),
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
        events: [],
      },
      app: new App({}),
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
        events: [],
      },
      app: new App({}),
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
        events: [],
      },
      app: new App({}),
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

describe('DataSource lifecycle / mock', () => {
  test('编辑器中使用 mock 数据', () => {
    const app = new App({}) as any;
    app.platform = 'editor';
    const ds = new DataSource({
      app,
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
        mocks: [{ useInEditor: true, data: { name: 'mock' }, enable: true }],
      } as any,
    });
    expect(ds.data.name).toBe('mock');
  });

  test('useMock=true 在运行时使用 mock', () => {
    const ds = new DataSource({
      app: new App({}),
      useMock: true,
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
        mocks: [{ enable: true, data: { name: 'enabled-mock' } }],
      } as any,
    });
    expect(ds.data.name).toBe('enabled-mock');
  });

  test('initialData 优先时设置 isInit', () => {
    const ds = new DataSource({
      app: new App({}),
      initialData: { name: 'preset' },
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
      },
    });
    expect(ds.isInit).toBe(true);
    expect(ds.data.name).toBe('preset');
  });

  test('支持自定义 ObservedDataClass', () => {
    const ds = new DataSource({
      app: new App({}),
      ObservedDataClass: DeepObservedData,
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
      },
    });
    const cb = vi.fn();
    ds.onDataChange('name', cb);
    ds.setData('next', 'name');
    expect(cb).toHaveBeenCalled();
    ds.offDataChange('name', cb);
  });

  test('setValue 等价于按 path 的 setData 并发出 change', () => {
    const ds = new DataSource({
      app: new App({}),
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
      },
    });
    const change = vi.fn();
    ds.on('change', change);
    ds.setValue('name', 'V');
    expect(ds.data.name).toBe('V');
    expect(change).toHaveBeenCalledWith({ updateData: 'V', path: 'name' });
  });

  test('setFields / setMethods / DATA_SOURCE_SET_DATA_METHOD_NAME 自动注入', () => {
    const ds = new DataSource({
      app: new App({}),
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
      },
    });
    ds.setFields([{ name: 'foo' }] as any);
    expect(ds.fields[0].name).toBe('foo');
    ds.setMethods([{ name: 'doIt' } as any]);
    expect(ds.methods[0].name).toBe('doIt');

    (ds as any).setDataFromEvent({ params: { field: ['name'], data: 'X' } });
    expect(ds.data.name).toBe('X');
  });

  test('destroy 清理 fields 与监听', () => {
    const ds = new DataSource({
      app: new App({}),
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
      },
    });
    const handler = vi.fn();
    ds.on('change', handler);
    ds.destroy();
    expect(ds.fields).toHaveLength(0);
    ds.emit('change', {});
    expect(handler).not.toHaveBeenCalled();
  });
});
