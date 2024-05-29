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
import { reactive } from 'vue';

import { type DepExtendedData, DepTargetType, type Target, type TargetNode, Watcher } from '@tmagic/dep';
import type { Id, MNode } from '@tmagic/schema';
import { isPage } from '@tmagic/utils';

import { IdleTask } from '@editor/utils/idle-task';

import BaseService from './BaseService';

export interface DepEvents {
  'add-target': [target: Target];
  'remove-target': [id: string | number];
  collected: [nodes: MNode[], deep: boolean];
}

const idleTask = new IdleTask<{ node: TargetNode; deep: boolean; target: Target }>();

class Dep extends BaseService {
  private watcher = new Watcher({ initialTargets: reactive({}) });

  public removeTargets(type: string = DepTargetType.DEFAULT) {
    this.watcher.removeTargets(type);

    const targets = this.watcher.getTargets(type);

    if (!targets) return;

    for (const target of Object.values(targets)) {
      this.emit('remove-target', target.id);
    }
  }

  public getTargets(type: string = DepTargetType.DEFAULT) {
    return this.watcher.getTargets(type);
  }

  public getTarget(id: Id, type: string = DepTargetType.DEFAULT) {
    return this.watcher.getTarget(id, type);
  }

  public addTarget(target: Target) {
    this.watcher.addTarget(target);
    this.emit('add-target', target);
  }

  public removeTarget(id: Id, type: string = DepTargetType.DEFAULT) {
    this.watcher.removeTarget(id, type);
    this.emit('remove-target', id);
  }

  public clearTargets() {
    this.watcher.clearTargets();
  }

  public collect(nodes: MNode[], depExtendedData: DepExtendedData = {}, deep = false, type?: DepTargetType) {
    this.watcher.collectByCallback(nodes, type, ({ node, target }) => {
      this.collectNode(node, target, depExtendedData, deep);
    });

    this.emit('collected', nodes, deep);
  }

  public collectIdle(nodes: MNode[], depExtendedData: DepExtendedData = {}, deep = false, type?: DepTargetType) {
    this.watcher.collectByCallback(nodes, type, ({ node, target }) => {
      idleTask.enqueueTask(
        ({ node, deep, target }) => {
          this.collectNode(node, target, depExtendedData, deep);
        },
        {
          node,
          deep,
          target,
        },
      );
    });

    idleTask.once('finish', () => {
      this.emit('collected', nodes, deep);
    });
  }

  collectNode(node: MNode, target: Target, depExtendedData: DepExtendedData = {}, deep = false) {
    // 先删除原有依赖，重新收集
    if (isPage(node)) {
      Object.entries(target.deps).forEach(([depKey, dep]) => {
        if (dep.data?.pageId && dep.data.pageId === depExtendedData.pageId) {
          delete target.deps[depKey];
        }
      });
    } else {
      this.watcher.removeTargetDep(target, node);
    }

    this.watcher.collectItem(node, target, depExtendedData, deep);
  }

  public clear(nodes?: MNode[]) {
    return this.watcher.clear(nodes);
  }

  public clearByType(type: DepTargetType, nodes?: MNode[]) {
    return this.watcher.clearByType(type, nodes);
  }

  public hasTarget(id: Id, type: string = DepTargetType.DEFAULT) {
    return this.watcher.hasTarget(id, type);
  }

  public hasSpecifiedTypeTarget(type: string = DepTargetType.DEFAULT): boolean {
    return this.watcher.hasSpecifiedTypeTarget(type);
  }

  public on<Name extends keyof DepEvents, Param extends DepEvents[Name]>(
    eventName: Name,
    listener: (...args: Param) => void | Promise<void>,
  ) {
    return super.on(eventName, listener as any);
  }

  public once<Name extends keyof DepEvents, Param extends DepEvents[Name]>(
    eventName: Name,
    listener: (...args: Param) => void | Promise<void>,
  ) {
    return super.once(eventName, listener as any);
  }

  public emit<Name extends keyof DepEvents, Param extends DepEvents[Name]>(eventName: Name, ...args: Param) {
    return super.emit(eventName, ...args);
  }
}

export type DepService = Dep;

export default new Dep();
