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

import { useContext, useEffect, useState } from 'react';

import type TMagicApp from '@tmagic/core';
import type { Id, MNodeInstance, Node as TMagicNode } from '@tmagic/core';
import { isDslNode } from '@tmagic/core';

import AppContent from '../AppContent';

interface Methods {
  [key: string]: (...args: any[]) => any;
}

export interface UseAppOptions<T extends MNodeInstance = MNodeInstance> {
  config: T;
  iteratorContainerId?: Id[];
  iteratorIndex?: number[];
  methods?: {
    [key: string]: (...args: any[]) => any;
  };
}

export const useNode = <T extends TMagicNode = TMagicNode>(
  props: Pick<UseAppOptions, 'config' | 'iteratorContainerId' | 'iteratorIndex'>,
  app = useContext(AppContent),
): T | undefined => {
  if (isDslNode(props.config) && props.config.id) {
    app?.getNode(props.config.id, props.iteratorContainerId, props.iteratorIndex);
  }
  return void 0;
};

export const registerNodeHooks = (node?: TMagicNode, methods: Methods = {}) => {
  if (!node) {
    return;
  }

  const emitData = {
    config: node.data,
    ...methods,
  };

  const [created, setCreated] = useState(false);

  if (!created) {
    // 只需要触发一次 created
    setCreated(true);
    node?.emit('created', emitData);
  }

  useEffect(() => {
    node?.emit('mounted', emitData);

    return () => {
      node?.emit('destroy', emitData);
    };
  }, []);
};

export const useApp = ({ methods = {}, config, iteratorContainerId, iteratorIndex }: UseAppOptions) => {
  const app: TMagicApp | undefined = useContext(AppContent);

  const node = useNode(
    {
      config,
      iteratorContainerId,
      iteratorIndex,
    },
    app,
  );

  if (node) {
    registerNodeHooks(node, methods);
  }

  const display = <T extends MNodeInstance>(config: T) => {
    if (config.visible === false) return false;
    if (config.condResult === false) return false;

    const displayCfg = config.display;

    if (typeof displayCfg === 'function') {
      return displayCfg({ app, node });
    }

    return displayCfg !== false;
  };

  return { app, node, display };
};
