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

import React, { useContext } from 'react';

import type TMagicApp from '@tmagic/core';
import type { Id, MComponent } from '@tmagic/core';
import { IS_DSL_NODE_KEY } from '@tmagic/core';
import { AppContent, useComponentStatus, useNode } from '@tmagic/react-runtime-help';

interface ComponentProps {
  config: Omit<MComponent, 'id'>;
  index: number;
  iteratorIndex: number[];
  iteratorContainerId: Id[];
}

const Container: React.FC<ComponentProps> = (props) => {
  const app: TMagicApp | undefined = useContext(AppContent);

  const node = useNode(props);
  const MagicUiComp = app?.resolveComponent(props.config.type || 'container');

  if (!MagicUiComp) return null;

  if (typeof props.config.display === 'function' && props.config.display({ app, node }) === false) {
    return null;
  }

  const { style, className } = useComponentStatus(props);

  return (
    <MagicUiComp
      data-tmagic-id={`${props.config.id || ''}`}
      data-container-index={props.index}
      data-tmagic-iterator-index={props.iteratorIndex}
      data-tmagic-iterator-container-id={props.iteratorContainerId}
      containerIndex={props.index}
      iteratorIndex={props.iteratorIndex}
      iteratorContainerId={props.iteratorContainerId}
      key={props.config.id ?? props.index}
      config={{ ...props.config, [IS_DSL_NODE_KEY]: true }}
      className={className}
      style={style}
    ></MagicUiComp>
  );
};

Container.displayName = 'magic-ui-container-item';

export default Container;
