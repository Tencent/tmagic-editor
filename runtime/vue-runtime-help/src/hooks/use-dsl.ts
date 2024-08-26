import { nextTick, onBeforeUnmount, reactive, ref } from 'vue-demi';

import Core from '@tmagic/core';
import type { ChangeEvent } from '@tmagic/data-source';
import type { MNode } from '@tmagic/schema';
import { isPage, replaceChildNode } from '@tmagic/utils';

export const useDsl = (app: Core | undefined) => {
  const pageConfig = ref(app?.page?.data || {});

  const updateDataHandler = (nodes: MNode[], sourceId: string, changeEvent: ChangeEvent) => {
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
  };

  app?.dataSourceManager?.on('update-data', updateDataHandler);

  onBeforeUnmount(() => {
    app?.dataSourceManager?.off('update-data', updateDataHandler);
  });

  return {
    pageConfig,
  };
};
