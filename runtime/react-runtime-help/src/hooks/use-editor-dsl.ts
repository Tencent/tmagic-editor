import { cloneDeep } from 'lodash-es';

import type { Id, MApp } from '@tmagic/core';
import type TMagicApp from '@tmagic/core';
import { getElById, replaceChildNode } from '@tmagic/core';
import type { Magic, RemoveData, SortEventData, UpdateData } from '@tmagic/stage';

declare global {
  interface Window {
    magic?: Magic;
  }
}

export const useEditorDsl = (app: TMagicApp | undefined, renderDom: () => void) => {
  let curPageId: Id = '';

  const updateConfig = (root: MApp) => {
    app?.setConfig(root, curPageId);
    renderDom();
  };

  window.magic?.onRuntimeReady({
    getApp() {
      return app;
    },

    updateRootConfig(root: MApp) {
      app?.setConfig(root);
    },

    updatePageId(id: Id) {
      curPageId = id;
      app?.setPage(curPageId);
      renderDom();
    },

    select(id: Id) {
      const el = getElById()(document, id);
      if (el) return el;
      // 未在当前文档下找到目标元素，可能是还未渲染，等待渲染完成后再尝试获取
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(getElById()(document, id));
        }, 0);
      });
    },

    add({ root }: UpdateData) {
      updateConfig(root);
    },

    update({ config, root, parentId }: UpdateData) {
      const newNode = app?.dataSourceManager?.compiledNode(config, undefined, true) || config;
      replaceChildNode(newNode, [root], parentId);
      updateConfig(cloneDeep(root));
    },

    sortNode({ root }: SortEventData) {
      root && updateConfig(root);
    },

    remove({ root }: RemoveData) {
      updateConfig(root);
    },
  });
};
