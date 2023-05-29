import { describe, expect, test } from 'vitest';

import { MApp, MNode, NodeType } from '@tmagic/schema';

import { createDataSourceManager, DataSourceManager } from '@data-source/index';

const dsl: MApp = {
  type: NodeType.ROOT,
  id: 'app_1',
  items: [
    {
      type: NodeType.PAGE,
      id: 'page_1',
      items: [
        {
          type: 'text',
          id: 61705611,
          text: '{{ds_bebcb2d5.text}}',
        },
      ],
    },
  ],
  dataSourceDeps: {
    ds_bebcb2d5: {
      61705611: {
        name: '文本',
        keys: ['text'],
      },
    },
  },
  dataSources: [
    {
      id: 'ds_bebcb2d5',
      type: 'http',
      fields: [
        {
          name: 'text',
        },
      ],
    },
  ],
};

describe('createDataSourceManager', () => {
  test('instance', () => {
    const manager = createDataSourceManager(dsl, (node: MNode) => node, {});
    expect(manager).toBeInstanceOf(DataSourceManager);
  });
});
