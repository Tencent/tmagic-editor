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

import Core from '@tmagic/core';
import type { MComponent, MNode } from '@tmagic/schema';

import AppContent from '../AppContent';
import useApp from '../useApp';

interface OverlayProps {
  config: MComponent;
}

const Overlay: React.FC<OverlayProps> = ({ config }) => {
  const [visible, setVisible] = useState(false);

  const app: Core | undefined = useContext(AppContent);
  const node = app?.page?.getNode(config.id);

  if (!app) return null;

  const openOverlay = () => {
    setVisible(true);
    if (app) {
      app.emit('overlay:open', node);
    }
  };

  const closeOverlay = () => {
    setVisible(false);
    if (app) {
      app.emit('overlay:close', node);
    }
  };

  useApp({
    config,
    methods: {
      openOverlay,
      closeOverlay,
    },
  });

  app?.page?.on('editor:select', (info: any, path: MNode[]) => {
    if (path.find((node: MNode) => node.id === config.id)) {
      openOverlay();
    } else {
      closeOverlay();
    }
  });

  if (!visible) return null;

  const MagicUiComp = app.resolveComponent('container');

  return (
    <MagicUiComp
      id={config.id}
      className="magic-ui-overlay"
      config={{ style: config.style, items: config.items }}
    ></MagicUiComp>
  );
};

Overlay.displayName = 'magic-ui-overlay';

export default Overlay;
