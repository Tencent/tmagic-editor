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

import React, { useEffect, useState } from 'react';

import { type Id, IS_DSL_NODE_KEY, type MComponent, type MContainer, type MNode, type MPage } from '@tmagic/core';
import { useApp } from '@tmagic/react-runtime-help';

interface OverlayProps {
  config: MComponent;
  className: string;
  style: Record<string, any>;
  id: string;
  containerIndex: number;
  iteratorIndex: number[];
  iteratorContainerId: Id[];
}

const Overlay: React.FC<OverlayProps> = ({
  config,
  id,
  style,
  className,
  containerIndex,
  iteratorIndex,
  iteratorContainerId,
}) => {
  const [visible, setVisible] = useState(false);

  const { app, node } = useApp({
    config,
    methods: {
      openOverlay() {
        setVisible(true);
        if (app) {
          app.emit('overlay:open', node);
        }
      },
      closeOverlay() {
        setVisible(false);
        if (app) {
          app.emit('overlay:close', node);
        }
      },
    },
  });

  if (!app) {
    return null;
  }

  const editorSelectHandler = (
    _info: {
      node: MNode;
      page: MPage;
      parent: MContainer;
    },
    path: MNode[],
  ) => {
    if (path.find((node: MNode) => node.id === config.id)) {
      node?.instance.openOverlay();
    } else {
      node?.instance.closeOverlay();
    }
  };

  useEffect(() => {
    app.page?.on('editor:select', editorSelectHandler);

    return () => {
      app.page?.off('editor:select', editorSelectHandler);
    };
  }, []);

  if (!visible) return null;

  const MagicUiComp = app?.resolveComponent('container');

  return (
    <MagicUiComp
      data-tmagic-id={`${id || config.id || ''}`}
      containerIndex={containerIndex}
      iteratorIndex={iteratorIndex}
      iteratorContainerId={iteratorContainerId}
      config={{ ...config, [IS_DSL_NODE_KEY]: false }}
      className={className}
      style={style}
    ></MagicUiComp>
  );
};

Overlay.displayName = 'magic-ui-overlay';

export default Overlay;
