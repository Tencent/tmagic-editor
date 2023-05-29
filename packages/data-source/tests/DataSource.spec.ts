import { describe, expect, test } from 'vitest';

import { DataSource } from '@data-source/index';

describe('DataSource', () => {
  test('instance', () => {
    const ds = new DataSource({
      schema: {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
      },
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
      },
    });

    ds.init();

    expect(ds.isInit).toBeTruthy();
  });
});
