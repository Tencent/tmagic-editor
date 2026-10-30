/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { cloneDeep, union } from 'lodash-es';

import type { default as TMagicApp, MNode, Page } from '@tmagic/core';
import { getDepNodeIds, getNodes, isPage, isPageFragment, replaceChildNodes } from '@tmagic/core';

import DataSourceManager from './DataSourceManager';
import type { BatchChange, BatchOptions, ChangeEvent, DataSourceManagerData } from './types';
import { updateNode } from './utils';

/**
 * 创建数据源管理器
 * @param {TMagicApp} app
 * @param {boolean} useMock 是否使用mock数据
 * @param {DataSourceManagerData} initialData 初始化数据，ssr数据可以由此传入
 * @returns {DataSourceManager | undefined}
 */
export const createDataSourceManager = (app: TMagicApp, useMock?: boolean, initialData?: DataSourceManagerData) => {
  const { dsl, platform } = app;
  if (!dsl?.dataSources) return;

  const dataSourceManager = new DataSourceManager({ app, useMock, initialData });

  if (dsl.dataSources && dsl.dataSourceCondDeps && platform !== 'editor') {
    getNodes(getDepNodeIds(dsl.dataSourceCondDeps), dsl.items).forEach((node) => {
      node.condResult = dataSourceManager.compliedConds(node);
      updateNode(node, dsl!);
    });
  }

  if (dsl.dataSources && dsl.dataSourceDeps) {
    getNodes(getDepNodeIds(dsl.dataSourceDeps), dsl.items).forEach((node) => {
      updateNode(dataSourceManager.compiledNode(node), dsl!);
    });
  }

  // ssr环境下，数据应该是提前准备好的（放到initialData中），不应该发生变化，无需监听
  // 有initialData不一定是在ssr环境下
  if (app.jsEngine === 'nodejs') {
    return dataSourceManager;
  }

  const updateByChanges = (changes: BatchChange[], options: BatchOptions = {}) => {
    // 按数据源归组，同一个数据源的多次变化按顺序保留
    const sources = new Map<string, { nodeIds: Set<string>; changeEvents: ChangeEvent[] }>();
    for (const { sourceId, changeEvent } of changes) {
      const dep = dsl.dataSourceDeps?.[sourceId] || {};
      const condDep = dsl.dataSourceCondDeps?.[sourceId] || {};
      const ids = [...Object.keys(condDep), ...Object.keys(dep)];

      const source = sources.get(sourceId);
      if (source) {
        ids.forEach((id) => source.nodeIds.add(id));
        source.changeEvents.push(changeEvent);
      } else {
        sources.set(sourceId, { nodeIds: new Set(ids), changeEvents: [changeEvent] });
      }
    }

    // 所有数据源涉及的节点只编译一次
    const nodeIds = union(...Array.from(sources.values()).map(({ nodeIds }) => Array.from(nodeIds)));

    for (const page of dsl.items) {
      if (app.platform === 'editor' || (isPage(page) && page.id === app.page?.data.id) || isPageFragment(page)) {
        const newNodes = getNodes(nodeIds, [page]).map((node) => {
          if (app.platform !== 'editor') {
            node.condResult = dataSourceManager.compliedConds(node);
          }

          return dataSourceManager.compiledNode(node);
        });

        if (typeof app.page?.setData === 'function') {
          // 需要替换到页面数据、页面片数据中的节点，收集后批量替换，避免每个节点都做一次全树搜索
          const replaceInPage: MNode[] = [];
          const replaceInFragments = new Map<Page, MNode[]>();

          for (const newNode of newNodes) {
            if (isPage(newNode)) {
              app.page.setData(newNode);
            } else if (page.id === app.page.data.id && !app.page.instance) {
              replaceInPage.push(newNode);
            }

            app.getNode(newNode.id, { strict: true })?.setData(newNode);

            for (const [, pageFragment] of app.pageFragments) {
              if (pageFragment.data.id === newNode.id) {
                pageFragment.setData(cloneDeep(newNode));
              } else if (pageFragment.data.id === page.id) {
                pageFragment.getNode(newNode.id, { strict: true })?.setData(cloneDeep(newNode));
                if (!pageFragment.instance) {
                  const list = replaceInFragments.get(pageFragment);
                  if (list) {
                    list.push(cloneDeep(newNode));
                  } else {
                    replaceInFragments.set(pageFragment, [cloneDeep(newNode)]);
                  }
                }
              }
            }
          }

          replaceChildNodes(replaceInPage, [app.page.data]);
          replaceInFragments.forEach((list, pageFragment) => {
            replaceChildNodes(list, [pageFragment.data]);
          });
        }

        if (newNodes.length) {
          sources.forEach(({ nodeIds: sourceNodeIds, changeEvents }, sourceId) => {
            const nodes =
              sources.size === 1 ? newNodes : newNodes.filter((newNode) => sourceNodeIds.has(`${newNode.id}`));

            if (!nodes.length) {
              return;
            }

            if (options.mergeChangeEvents === true) {
              // 合并成一次，changeEvent 为该数据源最后一次变化，中间变化（path / updateData）会丢失
              dataSourceManager.emit('update-data', nodes, sourceId, changeEvents[changeEvents.length - 1], page.id);
            } else {
              // 默认：每次变化各触发一次，各自携带自己的 changeEvent，中间变化不会丢失
              for (const changeEvent of changeEvents) {
                dataSourceManager.emit('update-data', nodes, sourceId, changeEvent, page.id);
              }
            }
          });
        }
      }
    }
  };

  dataSourceManager.on('change', (sourceId: string, changeEvent: ChangeEvent) => {
    // batch 期间的变化在 batch 结束后统一更新
    if (dataSourceManager.isBatching) {
      return;
    }

    updateByChanges([{ sourceId, changeEvent }]);
  });

  dataSourceManager.on('batch-change', updateByChanges);

  return dataSourceManager;
};
