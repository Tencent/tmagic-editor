import { useEffect, useRef, useState } from 'react';
import { cloneDeep } from 'lodash-es';

import type TMagicApp from '@tmagic/core';
import type { ChangeEvent, Id, MNode } from '@tmagic/core';
import { isPage, replaceChildNodes } from '@tmagic/core';

export const useDsl = (app: TMagicApp | undefined) => {
  const [pageConfig, setPageConfig] = useState(app?.page?.data);

  // 始终指向最新的页面配置，事件处理函数只注册一次，不能直接使用闭包里的 pageConfig（换页后会是旧页面）
  const pageConfigRef = useRef(pageConfig);
  pageConfigRef.current = pageConfig;

  // 同一次 batch 的多个 update-data 携带的是同一份已编译节点，重复替换内容相同却要再付一次全树遍历和整页 cloneDeep，
  // 因此按节点对象去重：同一个节点对象只替换一次（非 batch 场景下每次编译都是新对象，不受影响）
  const appliedNodesRef = useRef<WeakSet<MNode> | null>(null);
  if (!appliedNodesRef.current) {
    appliedNodesRef.current = new WeakSet();
  }

  useEffect(() => {
    if (!app) {
      return;
    }

    const pageChangeHandler = () => {
      appliedNodesRef.current = new WeakSet();
      pageConfigRef.current = app.page?.data;
      setPageConfig(app.page?.data);
    };

    app.on('page-change', pageChangeHandler);

    return () => {
      app.off('page-change', pageChangeHandler);
    };
  }, [app]);

  useEffect(() => {
    const dataSourceManager = app?.dataSourceManager;
    if (!app || !dataSourceManager) {
      return;
    }

    const updateDataHandler = (nodes: MNode[], sourceId: string, event: ChangeEvent, pageId?: Id) => {
      // 不是当前页面的更新（如页面片、其他页面）不处理
      if (!nodes.length || (pageId !== undefined && app.page?.data.id !== pageId)) {
        return;
      }

      const appliedNodes = appliedNodesRef.current!;

      let config = pageConfigRef.current;
      let pending: MNode[] = [];
      nodes.forEach((node) => {
        if (isPage(node)) {
          config && replaceChildNodes(pending, [config]);
          pending = [];
          config = node;
          appliedNodesRef.current = new WeakSet();
        } else if (!appliedNodes.has(node)) {
          pending.push(node);
        }
      });

      if (pending.length) {
        for (const node of pending) {
          appliedNodes.add(node);
        }
        config && replaceChildNodes(pending, [config]);

        const newConfig = cloneDeep(config);
        pageConfigRef.current = newConfig;
        setPageConfig(newConfig);
      }

      setTimeout(() => {
        app.emit('replaced-node', {
          ...event,
          nodes,
          sourceId,
        });
      }, 0);
    };

    dataSourceManager.on('update-data', updateDataHandler);

    return () => {
      dataSourceManager.off('update-data', updateDataHandler);
    };
  }, [app]);

  return { pageConfig };
};
