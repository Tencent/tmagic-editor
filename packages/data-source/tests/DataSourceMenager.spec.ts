import { describe, expect, test } from 'vitest';

import Core from '@tmagic/core';
import { NodeType } from '@tmagic/schema';

import { DataSource, DataSourceManager } from '@data-source/index';

const app = new Core({
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
      },
      {
        type: 'http',
        id: '2',
        fields: [{ name: 'name' }],
        methods: [],
      },
    ],
  },
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

  test('registe', () => {
    class TestDataSource extends DataSource {}

    DataSourceManager.registe('test', TestDataSource as any);
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
    });
    expect(dsm.get('1')).toBeInstanceOf(DataSource);
  });
});
