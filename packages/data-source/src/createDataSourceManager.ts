/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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
import { union } from 'lodash-es';

import type { AppCore } from '@tmagic/schema';
import { getDepNodeIds, getNodes } from '@tmagic/utils';

import DataSourceManager from './DataSourceManager';
import type { ChangeEvent, DataSourceManagerData } from './types';
import { updateNode } from './utils';

/**
 * 创建数据源管理器
 * @param app AppCore
 * @param useMock 是否使用mock数据
 * @param initialData 初始化数据，ssr数据可以由此传入
 * @returns DataSourceManager | undefined
 */
export const createDataSourceManager = (app: AppCore, useMock?: boolean, initialData?: DataSourceManagerData) => {
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
  if (app.jsEngine !== 'nodejs') {
    dataSourceManager.on('change', (sourceId: string, changeEvent: ChangeEvent) => {
      const dep = dsl.dataSourceDeps?.[sourceId] || {};
      const condDep = dsl.dataSourceCondDeps?.[sourceId] || {};

      const nodeIds = union([...Object.keys(condDep), ...Object.keys(dep)]);

      dataSourceManager.emit(
        'update-data',
        getNodes(nodeIds, dsl.items).map((node) => {
          if (app.platform !== 'editor') {
            node.condResult = dataSourceManager.compliedConds(node);
          }

          return dataSourceManager.compiledNode(node);
        }),
        sourceId,
        changeEvent,
      );
    });
  }

  return dataSourceManager;
};
