import { nextTick, onBeforeUnmount, reactive, ref } from 'vue-demi';

import type TMagicCore from '@tmagic/core';
import type { ChangeEvent, MNode } from '@tmagic/core';
import { isPage, replaceChildNode } from '@tmagic/core';

export const useDsl = (app?: TMagicCore) => {
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
