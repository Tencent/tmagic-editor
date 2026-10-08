import type { MApp } from '@tmagic/core';

import type { SdkOptions } from '@editor/sdk';
import { createDslSdk } from '@editor/sdk';

export const createDsl = (): MApp =>
  ({
    id: 'app_1',
    type: 'app',
    items: [
      {
        id: 'page_1',
        type: 'page',
        name: 'page',
        items: [
          { id: 'text_1', type: 'text', text: '${ds_1.name}' },
          { id: 'container_1', type: 'container', items: [{ id: 'button_1', type: 'button', text: 'btn' }] },
        ],
      },
    ],
    dataSources: [{ id: 'ds_1', type: 'base', title: 'ds', fields: [{ name: 'name' }], methods: [], events: [] }],
    codeBlocks: { code_1: { name: 'code', content: '() => {}', params: [] } },
  }) as any;

export const COMPONENT_GROUP_LIST = [
  {
    title: '基础',
    items: [
      { text: '文本', type: 'text' },
      { text: '按钮', type: 'button' },
    ],
  },
];

export const createSdk = (options: SdkOptions = {}) =>
  createDslSdk({
    dsl: createDsl(),
    componentGroupList: COMPONENT_GROUP_LIST,
    ...options,
  });
