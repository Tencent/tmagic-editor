import { inject, nextTick, onBeforeUnmount, reactive, ref } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import type { ChangeEvent, Id, MNode } from '@tmagic/core';
import { isPage, isPageFragment, replaceChildNode } from '@tmagic/core';

export const useDsl = (app = inject<TMagicApp>('app'), pageFragmentConstainerId: Id) => {
  if (!app) {
    throw new Error('useDsl must be used after MagicApp is created');
  }

  const pageFragment = pageFragmentConstainerId ? app.pageFragments.get(pageFragmentConstainerId) : null;

  const pageConfig = ref<MNode | undefined>(pageFragmentConstainerId ? pageFragment?.data : app.page?.data);

  if (pageFragmentConstainerId) {
    app.on('dsl-change', () => {
      pageConfig.value = pageFragment?.data;
    });
  } else {
    app.on('page-change', () => {
      pageConfig.value = app.page?.data;
    });
  }

  const updateDataHandler = (nodes: MNode[], sourceId: string, changeEvent: ChangeEvent, pageId: Id) => {
    if (
      !nodes.length ||
      (pageFragmentConstainerId && pageFragment?.data.id !== pageId) ||
      (!pageFragmentConstainerId && app.page?.data.id !== pageId)
    ) {
      return;
    }

    for (const node of nodes) {
      if (
        (isPage(node) && !pageFragmentConstainerId && node.id === pageId) ||
        (isPageFragment(node) && pageFragmentConstainerId)
      ) {
        pageConfig.value = node;
      } else {
        replaceChildNode(reactive(node), [pageConfig.value as MNode]);
      }
    }

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
