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

import type { Id, MComponent, MContainer, MPage, MPageFragment } from '@tmagic/schema';

import type App from './App';
import IteratorContainer from './IteratorContainer';
import type { default as TMagicNode } from './Node';
import Node from './Node';
interface ConfigOptions {
  config: MPage | MPageFragment;
  app: App;
}

class Page extends Node {
  public nodes = new Map<Id, TMagicNode>();

  constructor(options: ConfigOptions) {
    super(options);

    this.setNode(options.config.id, this);
    options.config.items.forEach((config) => {
      this.initNode(config, this);
    });
  }

  public initNode(config: MComponent | MContainer, parent: TMagicNode) {
    if (config.type && this.app.iteratorContainerType.has(config.type)) {
      this.setNode(
        config.id,
        new IteratorContainer({
          config,
          parent,
          page: this,
          app: this.app,
        }),
      );
      return;
    }

    const node = new Node({
      config,
      parent,
      page: this,
      app: this.app,
    });

    this.setNode(config.id, node);

    if (config.type && this.app.pageFragmentContainerType.has(config.type) && config.pageFragmentId) {
      const pageFragment = this.app.dsl?.items?.find((page) => page.id === config.pageFragmentId);
      if (pageFragment) {
        config.items = [pageFragment];
      }
    }

    config.items?.forEach((element: MComponent | MContainer) => {
      this.initNode(element, node);
    });
  }

  public getNode<T extends TMagicNode = TMagicNode>(
    id: Id,
    iteratorContainerId?: Id[],
    iteratorIndex?: number[],
  ): T | undefined {
    if (this.nodes.has(id)) {
      return this.nodes.get(id) as T;
    }

    if (Array.isArray(iteratorContainerId) && iteratorContainerId.length && Array.isArray(iteratorIndex)) {
      let iteratorContainer = this.nodes.get(iteratorContainerId[0]) as IteratorContainer;

      for (let i = 1, l = iteratorContainerId.length; i < l; i++) {
        iteratorContainer = iteratorContainer?.getNode(
          iteratorContainerId[i],
          iteratorIndex[i - 1],
        ) as IteratorContainer;
      }

      return iteratorContainer?.getNode(id, iteratorIndex[iteratorIndex.length - 1]) as T;
    }
  }

  public setNode(id: Id, node: TMagicNode) {
    this.nodes.set(id, node);
  }

  public deleteNode(id: Id) {
    this.nodes.delete(id);
  }

  public destroy(): void {
    super.destroy();

    this.nodes.clear();
  }
}

export default Page;
