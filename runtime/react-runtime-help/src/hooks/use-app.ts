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
import type { Id, MNodeInstance } from '@tmagic/core';
import { isDslNode } from '@tmagic/core';

import AppContent from '../AppContent';

interface UseAppOptions<T extends MNodeInstance = MNodeInstance> {
  config: T;
  iteratorContainerId?: Id[];
  iteratorIndex?: number[];
  methods?: {
    [key: string]: Function;
  };
}

export const useApp = ({ methods = {}, config, iteratorContainerId, iteratorIndex }: UseAppOptions) => {
  const app: TMagicApp | undefined = useContext(AppContent);

  const emitData = {
    config,
    ...methods,
  };

  const display = <T extends MNodeInstance>(config: T) => {
    if (config.visible === false) return false;
    if (config.condResult === false) return false;

    const displayCfg = config.display;

    if (typeof displayCfg === 'function') {
      return displayCfg(app);
    }

    return displayCfg !== false;
  };

  const node = isDslNode(config) && config.id ? app?.getNode(config.id, iteratorContainerId, iteratorIndex) : undefined;
  const [created, setCreated] = useState(false);

  if (node) {
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
  }

  return { app, node, display };
};
