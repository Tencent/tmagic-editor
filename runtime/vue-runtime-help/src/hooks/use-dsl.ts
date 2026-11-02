import { inject, nextTick, onBeforeUnmount, reactive, ref } from 'vue';

import type TMagicApp from '@tmagic/core';
import type { ChangeEvent, Id, MNode } from '@tmagic/core';
import { isPage, isPageFragment, replaceChildNodes } from '@tmagic/core';

export const useDsl = (app = inject<TMagicApp>('app'), pageFragmentContainerId?: Id) => {
  if (!app) {
    throw new Error('useDsl must be used after MagicApp is created');
  }

  // 页面片实例会在关联关系变化时被重建，不能只取 setup 时那一次快照
  const getPageFragment = () => (pageFragmentContainerId ? app.pageFragments.get(pageFragmentContainerId) : undefined);

  // 同一次 batch 的多个 update-data 携带的是同一份已编译节点，重复替换内容相同却要再付一次全树遍历，
  // 因此按节点对象去重：同一个节点对象只替换一次（非 batch 场景下每次编译都是新对象，不受影响）
  let appliedNodes: WeakSet<MNode> = new WeakSet();

  const applyNodes = (nodes: MNode[], config: MNode) => {
    const pending = nodes.filter((node) => !appliedNodes.has(node));

    if (!pending.length) {
      return;
    }

    for (const node of pending) {
      appliedNodes.add(node);
    }

    replaceChildNodes(pending, [config]);
  };

  const pageConfig = ref<MNode | undefined>(pageFragmentContainerId ? getPageFragment()?.data : app.page?.data);

  if (pageFragmentContainerId) {
    const setPageConfig = () => {
      appliedNodes = new WeakSet();
      pageConfig.value = getPageFragment()?.data;
    };
    app.on('dsl-change', setPageConfig);
    app.on('page-fragments-change', setPageConfig);

    onBeforeUnmount(() => {
      app.off('dsl-change', setPageConfig);
      app.off('page-fragments-change', setPageConfig);
    });
  } else {
    const setPageConfig = () => {
      appliedNodes = new WeakSet();
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
      (pageFragmentContainerId && getPageFragment()?.data.id !== pageId) ||
      (!pageFragmentContainerId && app.page?.data.id !== pageId)
    ) {
      return;
    }

    // 批量替换，避免每个节点都做一次全树搜索
    let pending: MNode[] = [];
    for (const node of nodes) {
      if (
        (isPage(node) && !pageFragmentContainerId && node.id === pageId) ||
        (isPageFragment(node) && pageFragmentContainerId)
      ) {
        applyNodes(pending, pageConfig.value as MNode);
        pending = [];
        pageConfig.value = node;
        appliedNodes = new WeakSet();
      } else {
        const newNode = reactive(node) as MNode;
        if (!appliedNodes.has(newNode)) {
          pending.push(newNode);
        }
      }
    }
    applyNodes(pending, pageConfig.value as MNode);

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
