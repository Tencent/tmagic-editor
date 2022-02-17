/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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

import { Id, MComponent, MContainer, MPage } from '@tmagic/schema';

import Node from './Node';
interface ConfigOptions {
  config: MPage;
}

class Page extends Node {
  nodes = new Map<Id, Node>();

  constructor(options: ConfigOptions) {
    super(options.config);

    this.setNode(options.config.id, this);
    this.initNode(options.config);
  }

  initNode(config: MComponent | MContainer) {
    this.setNode(config.id, new Node(config));

    config.items?.forEach((element: MComponent | MContainer) => {
      this.initNode(element);
    });
  }

  getNode(id: Id) {
    return this.nodes.get(id);
  }

  setNode(id: Id, node: Node) {
    this.nodes.set(id, node);
  }

  deleteNode(id: Id) {
    this.nodes.delete(id);
  }
}

export default Page;
