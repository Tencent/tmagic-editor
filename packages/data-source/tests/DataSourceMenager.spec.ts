import { afterAll, describe, expect, test } from 'vitest';

import TMagicApp, { NodeType } from '@tmagic/core';

import { DataSource, DataSourceManager } from '@data-source/index';

const app = new TMagicApp({
  config: {
    type: NodeType.ROOT,
    id: '1',
    items: [],
    dataSources: [
      {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
      },
      {
        type: 'http',
        id: '2',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
      },
    ],
  },
});

afterAll(async () => {
  DataSourceManager.clearDataSourceClass();
});

describe('DataSourceManager', () => {
  const dsm = new DataSourceManager({
    app,
  });

  test('instance', () => {
    expect(dsm).toBeInstanceOf(DataSourceManager);
    expect(dsm.dataSourceMap.get('1')).toBeInstanceOf(DataSource);
    expect(dsm.dataSourceMap.get('2')?.type).toBe('http');
  });

  test('register', () => {
    class TestDataSource extends DataSource {}

    DataSourceManager.register('test', TestDataSource as any);
    expect(DataSourceManager.getDataSourceClass('test')).toBe(TestDataSource);
  });

  test('get', () => {
    const ds = dsm.get('1');
    expect(ds).toBeInstanceOf(DataSource);
  });

  test('removeDataSource', () => {
    dsm.removeDataSource('1');
    const ds = dsm.get('1');
    expect(ds).toBeUndefined();
  });

  test('updateSchema', () => {
    const dsm = new DataSourceManager({ app });

    dsm.updateSchema([
      {
        type: 'base',
        id: '1',
        fields: [{ name: 'name1' }],
        methods: [],
        events: [],
      },
    ]);
    const ds = dsm.get('1');
    expect(ds).toBeInstanceOf(DataSource);
  });

  test('destroy', () => {
    dsm.destroy();
    expect(dsm.dataSourceMap.size).toBe(0);
  });

  test('addDataSource error', async () => {
    await dsm.addDataSource({
      type: 'base',
      id: '1',
      fields: [{ name: 'name' }],
      methods: [],
      events: [],
    });
    expect(dsm.get('1')).toBeInstanceOf(DataSource);
  });
});
