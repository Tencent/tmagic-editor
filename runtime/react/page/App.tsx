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

import React, { useContext, useState } from 'react';
import { cloneDeep } from 'lodash-es';

import type Core from '@tmagic/core';
import type { ChangeEvent } from '@tmagic/data-source';
import type { MNode } from '@tmagic/schema';
import { AppContent } from '@tmagic/ui-react';
import { isPage, replaceChildNode } from '@tmagic/utils';

function App() {
  const app = useContext<Core | undefined>(AppContent);

  if (!app?.page) return null;

  const [config, setConfig] = useState(app.page.data);

  app.dataSourceManager?.on('update-data', (nodes: MNode[], sourceId: string, event: ChangeEvent) => {
    let pageConfig = config;
    nodes.forEach((node) => {
      if (isPage(node)) {
        pageConfig = node;
      } else {
        replaceChildNode(node, [pageConfig]);
      }
    });

    setConfig(cloneDeep(pageConfig));

    setTimeout(() => {
      app.emit('replaced-node', {
        ...event,
        nodes,
        sourceId,
      });
    }, 0);
  });

  const MagicUiPage = app.resolveComponent('page');

  return <MagicUiPage config={config}></MagicUiPage>;
}

export default App;
