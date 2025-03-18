import { inject, nextTick, onBeforeUnmount, reactive, ref } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import type { ChangeEvent, MNode } from '@tmagic/core';
import { isPage, replaceChildNode } from '@tmagic/core';

export const useDsl = (app = inject<TMagicApp>('app')) => {
  if (!app) {
    throw new Error('useDsl must be used after MagicApp is created');
  }

  const pageConfig = ref<MNode | undefined>(app.page?.data);

  app.on('page-change', () => {
    pageConfig.value = app.page?.data;
  });

  const updateDataHandler = (nodes: MNode[], sourceId: string, changeEvent: ChangeEvent) => {
    nodes.forEach((node) => {
      if (isPage(node)) {
        pageConfig.value = node;
      } else {
        replaceChildNode(reactive(node), [pageConfig.value as MNode]);
      }
    });

    nextTick(() => {
      app.emit('replaced-node', { nodes, sourceId, ...changeEvent });
    });
  };

  if (app.dataSourceManager) {
    app.dataSourceManager.on('update-data', updateDataHandler);

    onBeforeUnmount(() => {
      app.dataSourceManager!.off('update-data', updateDataHandler);
    });
  }

  return {
    app,
    pageConfig,
  };
};
