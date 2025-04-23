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

import { inject, onBeforeUnmount, onMounted } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import type { Id, MNodeInstance, Node as TMagicNode } from '@tmagic/core';
import { isDslNode } from '@tmagic/core';

interface Methods {
  [key: string]: (...args: any[]) => any;
}

interface UseAppOptions<T extends MNodeInstance = MNodeInstance> {
  config: T;
  iteratorContainerId?: Id[];
  iteratorIndex?: number[];
  methods?: Methods;
}

export const useNode = <T extends TMagicNode = TMagicNode>(
  props: Pick<UseAppOptions, 'config' | 'iteratorContainerId' | 'iteratorIndex'>,
  app = inject<TMagicApp>('app'),
): T | undefined => {
  if (isDslNode(props.config) && props.config.id) {
    return app?.getNode(props.config.id, props.iteratorContainerId, props.iteratorIndex);
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

  node.emit('created', emitData);

  onMounted(() => {
    node.emit('mounted', emitData);
  });

  onBeforeUnmount(() => {
    node.emit('destroy', emitData);
  });
};

export const useApp = <T extends TMagicApp = TMagicApp>({
  methods,
  config,
  iteratorContainerId,
  iteratorIndex,
}: UseAppOptions) => {
  const app = inject<T>('app');

  if (!app) {
    throw new Error(`component ${config.type}: app is not injected`);
  }

  const node = useNode(
    {
      config,
      iteratorContainerId,
      iteratorIndex,
    },
    app,
  );

  if (node && methods) {
    registerNodeHooks(node, methods);
  }

  return {
    app,
    node,
  };
};
