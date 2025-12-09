import { inject, nextTick, onBeforeUnmount, reactive, ref } from 'vue';

import type TMagicApp from '@tmagic/core';
import type { ChangeEvent, Id, MNode } from '@tmagic/core';
import { isPage, isPageFragment, replaceChildNode } from '@tmagic/core';

export const useDsl = (app = inject<TMagicApp>('app'), pageFragmentContainerId?: Id) => {
  if (!app) {
    throw new Error('useDsl must be used after MagicApp is created');
  }

  const pageFragment = pageFragmentContainerId ? app.pageFragments.get(pageFragmentContainerId) : null;

  const pageConfig = ref<MNode | undefined>(pageFragmentContainerId ? pageFragment?.data : app.page?.data);

  if (pageFragmentContainerId) {
    const setPageConfig = () => {
      pageConfig.value = pageFragment?.data;
    };
    app.on('dsl-change', setPageConfig);

    onBeforeUnmount(() => {
      app.off('dsl-change', setPageConfig);
    });
  } else {
    const setPageConfig = () => {
      pageConfig.value = app.page?.data;
    };
    app.on('page-change', setPageConfig);

    onBeforeUnmount(() => {
      app.off('page-change', setPageConfig);
    });
  }

  const updateDataHandler = (nodes: MNode[], sourceId: string, changeEvent: ChangeEvent, pageId: Id) => {
    if (
      !nodes.length ||
      (pageFragmentContainerId && pageFragment?.data.id !== pageId) ||
      (!pageFragmentContainerId && app.page?.data.id !== pageId)
    ) {
      return;
    }

    for (const node of nodes) {
      if (
        (isPage(node) && !pageFragmentContainerId && node.id === pageId) ||
        (isPageFragment(node) && pageFragmentContainerId)
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
