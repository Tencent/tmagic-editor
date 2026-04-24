import { computed, inject, nextTick, reactive, ref, watch } from 'vue';

import type TMagicApp from '@tmagic/core';
import type { Id, MApp, MNode, MPage, MPageFragment } from '@tmagic/core';
import { asyncLoadCss, getElById, getNodePath, replaceChildNode } from '@tmagic/core';
import type { Magic, RemoveData, Runtime, UpdateData } from '@tmagic/stage';

declare global {
  interface Window {
    magic?: Magic;
  }
}

let styleEl: HTMLStyleElement | null = null;

const createCss = async (config: MPage | MPageFragment) => {
  if (config.cssFile) {
    await asyncLoadCss(config.cssFile, window.document);
  }
  if (config.css) {
    if (!styleEl) {
      styleEl = window.document.createElement('style');
      window.document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = config.css;
  }
};

export const useEditorDsl = (app = inject<TMagicApp>('app'), runtimeApi: Runtime = {}, win = window) => {
  const root = ref<MApp>();
  const curPageId = ref<Id>();
  const selectedId = ref<Id>();

  const pageConfig = computed(
    () => root.value?.items?.find((item: MNode) => item.id === curPageId.value) || root.value?.items?.[0],
  );

  watch(pageConfig, (config) => {
    if (!config) return;

    setTimeout(() => {
      const page =
        document.querySelector<HTMLElement>('.magic-ui-page') ||
        document.querySelector<HTMLElement>('.magic-ui-page-fragment');
      page && win.magic?.onPageElUpdate(page);
    });

    createCss(config);
  });

  const updateRoot = (config: MApp) => {
    root.value = config;
    if (typeof curPageId.value === 'undefined') {
      curPageId.value = config.items?.[0]?.id;
    }

    if (typeof selectedId.value === 'undefined') {
      selectedId.value = curPageId.value;
    }

    app?.setConfig(config, curPageId.value);
  };

  window.magic?.onRuntimeReady({
    getApp: () => app,

    updateRootConfig: (config: MApp) => {
      updateRoot(config);
    },

    updatePageId(id: Id) {
      curPageId.value = id;
      app?.setPage(id);
    },

    select(id: Id) {
      selectedId.value = id;

      if (app?.getPage(id)) {
        this.updatePageId?.(id);
      }

      const el = getElById()(document, `${id}`);
      if (el) return el;
      // 未在当前文档下找到目标元素，可能是还未渲染，等待渲染完成后再尝试获取
      return nextTick().then(() => getElById()(document, `${id}`));
    },

    add: ({ config, parentId, root: appConfig }: UpdateData) => {
      if (!root.value) {
        if (appConfig) {
          updateRoot(appConfig);
          return;
        }
        throw new Error('error');
      }
      if (!selectedId.value) throw new Error('error');
      if (!parentId) throw new Error('error');

      const parent = getNodePath(parentId, [root.value]).pop();
      if (!parent) throw new Error('未找到父节点');

      if (config.type !== 'page') {
        const parentNode = app?.page?.getNode(parent.id, { strict: true });
        parentNode && app?.page?.initNode(config, parentNode);
      }

      if (parent.id !== selectedId.value) {
        const index = parent.items?.findIndex((child: MNode) => child.id === selectedId.value);
        parent.items?.splice(index + 1, 0, config);
      } else {
        // 新增节点添加到配置中
        parent.items?.push(config);
      }
    },

    update: ({ config, parentId, root: appConfig }: UpdateData) => {
      if (!root.value) {
        if (appConfig) {
          updateRoot(appConfig);
          return;
        }
        throw new Error('error');
      }
      if (!app) throw new Error('error');

      const newNode = app.dataSourceManager?.compiledNode(config, undefined, true) || config;

      replaceChildNode(reactive(newNode), [root.value], parentId);

      const nodeInstance = app.getNode(config.id, { strict: true });
      if (nodeInstance) {
        nodeInstance.setData(newNode);
      }

      if (app.page?.data.id === config.id) {
        app.page.setData(newNode);
      }
    },

    remove: ({ id, parentId }: RemoveData) => {
      if (!root.value) throw new Error('error');

      const node = getNodePath(id, [root.value]).pop();
      if (!node) throw new Error('未找到目标元素');

      const parent = getNodePath(parentId, [root.value]).pop();
      if (!parent) throw new Error('未找到父元素');

      if (node.type === 'page') {
        app?.deletePage();
      } else {
        app?.page?.deleteNode(node.id);
      }

      const index = parent.items?.findIndex((child: MNode) => child.id === node.id);
      parent.items.splice(index, 1);
    },

    ...runtimeApi,
  });

  return {
    root,
    pageConfig,
    app,
  };
};
