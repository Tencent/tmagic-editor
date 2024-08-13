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

import { useApp } from '@tmagic/react-runtime-help';
import type { Id, MContainer, MNode } from '@tmagic/schema';
import { IS_DSL_NODE_KEY } from '@tmagic/utils';

interface ContainerSchema extends Omit<MContainer, 'id'> {
  id?: Id;
  type?: 'container';
}

interface ContainerProps {
  config: ContainerSchema;
  className: string;
  style: Record<string, any>;
  id: string;
  containerIndex: number;
  iteratorIndex: number[];
  iteratorContainerId: Id[];
}

const Container: React.FC<ContainerProps> = ({
  config,
  id,
  style,
  className,
  containerIndex,
  iteratorIndex,
  iteratorContainerId,
}) => {
  const { app, display } = useApp({ config });

  if (!app) return null;

  const classNames = config[IS_DSL_NODE_KEY] ? [] : ['magic-ui-container'];
  if (config.layout) {
    classNames.push(`magic-layout-${config.layout}`);
  }
  if (className) {
    classNames.push(className);
  }

  return (
    <div
      data-tmagic-id={`${id || ''}`}
      data-container-index={containerIndex}
      data-tmagic-iterator-index={iteratorIndex}
      data-tmagic-iterator-container-id={iteratorContainerId}
      className={classNames.join(' ')}
      style={config[IS_DSL_NODE_KEY] ? style : app.transformStyle(config.style || {})}
    >
      {config.items?.map((item: MNode, index: number) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const MagicUiComp = app.resolveComponent(item.type || 'container');

        if (!MagicUiComp) return null;

        if (!display(item)) return null;

        const itemClassName = [`magic-ui-${item.type}`];
        if (item.className) {
          itemClassName.push(item.className);
        }

        return (
          <MagicUiComp
            id={`${item.id || ''}`}
            containerIndex={index}
            iteratorIndex={iteratorIndex}
            iteratorContainerId={iteratorContainerId}
            key={item.id ?? index}
            config={{ ...item, [IS_DSL_NODE_KEY]: true }}
            className={itemClassName.join(' ')}
            style={app.transformStyle(item.style || {})}
          ></MagicUiComp>
        );
      })}
    </div>
  );
};

Container.displayName = 'magic-ui-container';

export default Container;
