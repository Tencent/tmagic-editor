import { nextTick, reactive, ref } from 'vue-demi';

import Core from '@tmagic/core';
import type { ChangeEvent } from '@tmagic/data-source';
import type { MNode } from '@tmagic/schema';
import { isPage, replaceChildNode } from '@tmagic/utils';

export const useDsl = (app: Core | undefined) => {
  const pageConfig = ref(app?.page?.data || {});

  app?.dataSourceManager?.on('update-data', (nodes: MNode[], sourceId: string, changeEvent: ChangeEvent) => {
    nodes.forEach((node) => {
      if (isPage(node)) {
        pageConfig.value = node;
      } else {
        replaceChildNode(reactive(node), [pageConfig.value as MNode]);
      }
    });

    if (!app) return;

    nextTick(() => {
      app.emit('replaced-node', { nodes, sourceId, ...changeEvent });
    });
  });

  return {
    pageConfig,
  };
};
