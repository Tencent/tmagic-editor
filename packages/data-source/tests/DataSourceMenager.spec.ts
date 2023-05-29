import { describe, expect, test } from 'vitest';

import { DataSource, DataSourceManager } from '@data-source/index';

describe('DataSourceManager', () => {
  const dsm = new DataSourceManager({
    dataSourceConfigs: [
      {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
      },
      {
        type: 'http',
        id: '2',
        fields: [{ name: 'name' }],
      },
    ],
    httpDataSourceOptions: {
      request: () => Promise.resolve(),
    },
  });

  test('instance', () => {
    expect(dsm).toBeInstanceOf(DataSourceManager);
    expect(dsm.dataSourceMap.get('1')).toBeInstanceOf(DataSource);
    expect(dsm.dataSourceMap.get('2')?.type).toBe('http');
  });

  test('registe', () => {
    class TestDataSource extends DataSource {}

    DataSourceManager.registe('test', TestDataSource);
    expect(DataSourceManager.dataSourceClassMap.get('test')).toBe(TestDataSource);
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
    const dsm = new DataSourceManager({
      dataSourceConfigs: [
        {
          type: 'base',
          id: '1',
          fields: [{ name: 'name' }],
        },
      ],
      httpDataSourceOptions: {
        request: () => Promise.resolve(),
      },
    });

    dsm.updateSchema([
      {
        type: 'base',
        id: '1',
        fields: [{ name: 'name1' }],
      },
    ]);
    const ds = dsm.get('1');
    expect(ds).toBeInstanceOf(DataSource);
  });

  test('destroy', () => {
    dsm.destroy();
    expect(dsm.dataSourceMap.size).toBe(0);
  });

  test('addDataSource error', () => {
    expect(dsm.addDataSource()).toBeUndefined();
  });
});
