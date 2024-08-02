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

import type Core from '@tmagic/core';
import type { MNode } from '@tmagic/schema';
import { IS_DSL_NODE_KEY } from '@tmagic/utils';

interface UseAppOptions<T extends MNode = MNode> {
  config: T;
  methods?: {
    [key: string]: Function;
  };
}

const isDslNode = (config: MNode) => typeof config[IS_DSL_NODE_KEY] === 'undefined' || config[IS_DSL_NODE_KEY] === true;

export default ({ methods, config }: UseAppOptions) => {
  const app: Core | undefined = inject('app');

  const emitData = {
    config,
    ...methods,
  };

  const display = <T extends MNode>(config: T) => {
    if (config.visible === false) return false;
    if (config.condResult === false) return false;

    const displayCfg = config.display;

    if (typeof displayCfg === 'function') {
      return displayCfg(app);
    }

    return displayCfg !== false;
  };

  const node = isDslNode(config) ? app?.page?.getNode(config.id || '') : undefined;

  if (node) {
    node.emit('created', emitData);

    onMounted(() => {
      node.emit('mounted', emitData);
    });

    onBeforeUnmount(() => {
      node.emit('destroy', emitData);
    });
  }

  return {
    app,
    node,

    display,
  };
};
