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

import type { Id, MNode } from '@tmagic/schema';

import type { default as TMagicNode } from './Node';
import Node from './Node';

class IteratorContainer extends Node {
  public nodes: Map<Id, TMagicNode>[] = [];

  public setData(data: MNode) {
    this.resetNodes();

    super.setData(data);
  }

  public resetNodes() {
    this.nodes?.forEach((nodeMap) => {
      nodeMap.forEach((node) => {
        node.destroy();
      });
    });

    this.nodes = [];
  }

  public initNode(config: MNode, parent: TMagicNode, map: Map<Id, TMagicNode>) {
    if (map.has(config.id)) {
      map.get(config.id)?.destroy();
    }

    if (config.type && this.app.iteratorContainerType.has(config.type)) {
      const iteratorContainer = new IteratorContainer({
        config,
        parent,
        page: this.page,
        app: this.app,
      });
      map.set(config.id, iteratorContainer);

      this.app.eventHelper?.bindNodeEvents(iteratorContainer);
      return;
    }

    const node = new Node({
      config,
      parent,
      page: this.page,
      app: this.app,
    });

    this.app.eventHelper?.bindNodeEvents(node);

    map.set(config.id, node);

    if (config.type && this.app.pageFragmentContainerType.has(config.type) && config.pageFragmentId) {
      const pageFragment = this.app.dsl?.items?.find((page) => page.id === config.pageFragmentId);
      if (pageFragment) {
        config.items = [pageFragment];
      }
    }

    config.items?.forEach((element: MNode) => {
      this.initNode(element, node, map);
    });
  }

  public setNodes(nodes: MNode[], index: number) {
    const map = this.nodes[index] || new Map();

    nodes.forEach((node) => {
      this.initNode(node, this, map);
    });

    this.nodes[index] = map;
  }

  public getNode(id: Id, index: number) {
    return this.nodes[index]?.get(id);
  }

  public destroy(): void {
    super.destroy();
    this.resetNodes();
  }
}

export default IteratorContainer;
