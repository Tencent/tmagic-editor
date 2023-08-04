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

import React from 'react';

import type { MComponent, MContainer } from '@tmagic/schema';

import useApp from '../useApp';

interface ContainerProps {
  config: MContainer;
  className: string;
  style: Record<string, any>;
  id: string;
}

const Container: React.FC<ContainerProps> = ({ config, id }) => {
  const { app } = useApp({ config });

  if (!app) return null;

  return (
    <div
      id={`${id || config.id || ''}`}
      className={`magic-ui-container magic-layout-${config.layout}${config.className ? ` ${config.className}` : ''}`}
      style={app.transformStyle(config.style || {})}
    >
      {config.items?.map((item: MComponent | MContainer) => {
        const MagicUiComp = app.resolveComponent(item.type || 'container');

        if (!MagicUiComp) return null;

        if (item.visible === false) return null;
        if (item.condResult === false) return null;

        return (
          <MagicUiComp
            id={`${item.id || ''}`}
            key={item.id}
            config={item}
            className={`magic-ui-component${config.className ? ` ${config.className}` : ''}`}
            style={app.transformStyle(item.style || {})}
          ></MagicUiComp>
        );
      })}
    </div>
  );
};

Container.displayName = 'magic-ui-container';

export default Container;
