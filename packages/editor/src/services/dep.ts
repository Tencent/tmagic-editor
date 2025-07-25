/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
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
import { reactive, shallowReactive } from 'vue';
import { throttle } from 'lodash-es';
import serialize from 'serialize-javascript';

import type { DepData, DepExtendedData, Id, MApp, MNode, Target, TargetNode } from '@tmagic/core';
import { DepTargetType, traverseTarget, Watcher } from '@tmagic/core';
import { isPage } from '@tmagic/utils';

import { IdleTask } from '@editor/utils/dep/idle-task';
import Work from '@editor/utils/dep/worker.ts?worker&inline';

import BaseService from './BaseService';

export interface DepEvents {
  'add-target': [target: Target];
  'remove-target': [id: string | number, type: string | DepTargetType];
  collected: [nodes: MNode[], deep: boolean];
  'ds-collected': [nodes: MNode[], deep: boolean];
}

interface State {
  collecting: boolean;
  taskLength: number;
}

type StateKey = keyof State;

class Dep extends BaseService {
  private state = shallowReactive<State>({
    collecting: false,
    taskLength: 0,
  });

  private idleTask = new IdleTask<{ node: TargetNode; deep: boolean; target: Target }>();

  private watcher = new Watcher({ initialTargets: reactive({}) });

  private waitingWorker?: Promise<void>;

  constructor() {
    super();

    this.idleTask.on(
      'update-task-length',
      throttle(({ length }) => {
        this.set('taskLength', length);
      }, 1000),
    );
  }

  public set<K extends StateKey, T extends State[K]>(name: K, value: T) {
    this.state[name] = value;
  }

  public get<K extends StateKey>(name: K): State[K] {
    return this.state[name];
  }

  public removeTargets(type: string = DepTargetType.DEFAULT) {
    this.watcher.removeTargets(type);

    const targets = this.watcher.getTargets(type);

    if (!targets) return;

    for (const target of Object.values(targets)) {
      this.emit('remove-target', target.id, type);
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
    this.emit('remove-target', id, type);
  }

  public clearTargets() {
    this.watcher.clearTargets();
  }

  public collect(nodes: MNode[], depExtendedData: DepExtendedData = {}, deep = false, type?: DepTargetType) {
    this.set('collecting', true);
    this.watcher.collectByCallback(nodes, type, ({ node, target }) => {
      this.collectNode(node, target, depExtendedData, deep);
    });
    this.set('collecting', false);

    this.emit('collected', nodes, deep);
    this.emit('ds-collected', nodes, deep);
  }

  public async collectIdle(nodes: MNode[], depExtendedData: DepExtendedData = {}, deep = false, type?: DepTargetType) {
    if (this.waitingWorker) {
      await this.waitingWorker;
    }

    this.set('collecting', true);
    let startTask = false;
    this.watcher.collectByCallback(nodes, type, ({ node, target }) => {
      startTask = true;

      this.enqueueTask(node, target, depExtendedData, deep);
    });

    return new Promise<void>((resolve) => {
      if (!startTask) {
        this.emit('collected', nodes, deep);
        this.set('collecting', false);
        resolve();
        return;
      }
      this.idleTask.once('finish', () => {
        this.emit('collected', nodes, deep);
        this.set('collecting', false);
      });
      this.idleTask.once('hight-level-finish', () => {
        this.emit('ds-collected', nodes, deep);
        resolve();
      });
    });
  }

  public collectByWorker(dsl: MApp) {
    this.set('collecting', true);

    const { promise, resolve: waitingResolve } = Promise.withResolvers<void>();

    this.waitingWorker = promise;

    return new Promise<Record<string, Record<string, DepData>>>((resolve) => {
      const worker = new Work();
      worker.postMessage({
        dsl: serialize(dsl),
      });
      worker.onmessage = (e) => {
        resolve(e.data);
      };
      worker.onerror = () => {
        resolve({});
      };
    }).then((depsData) => {
      traverseTarget(this.watcher.getTargetsList(), (target) => {
        if (depsData[target.type]?.[target.id]) {
          target.deps = reactive(depsData[target.type][target.id]);

          if (target.type === DepTargetType.DATA_SOURCE && dsl.dataSourceDeps) {
            dsl.dataSourceDeps[target.id] = target.deps;
          } else if (target.type === DepTargetType.DATA_SOURCE_COND && dsl.dataSourceCondDeps) {
            dsl.dataSourceCondDeps[target.id] = target.deps;
          } else if (target.type === DepTargetType.DATA_SOURCE_METHOD) {
            dsl.dataSourceMethodDeps[target.id] = target.deps;
          }
        }
      });

      this.set('collecting', false);
      this.emit('collected', dsl.items, true);
      this.emit('ds-collected', dsl.items, true);
      waitingResolve();

      return depsData;
    });
  }

  public collectNode(node: MNode, target: Target, depExtendedData: DepExtendedData = {}, deep = false) {
    // 先删除原有依赖，重新收集
    if (isPage(node)) {
      for (const [depKey, dep] of Object.entries(target.deps)) {
        if (dep.data?.pageId && dep.data.pageId === depExtendedData.pageId) {
          delete target.deps[depKey];
        }
      }
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

  public clearIdleTasks() {
    this.idleTask.clearTasks();
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

  public reset() {
    this.idleTask.clearTasks();

    for (const type of Object.keys(this.watcher.getTargetsList())) {
      this.removeTargets(type);
    }

    this.set('collecting', false);
  }

  public destroy() {
    this.idleTask.removeAllListeners();

    this.removeAllListeners();
    this.reset();
    this.removeAllPlugins();
    this.idleTask.removeAllListeners();
  }

  public emit<Name extends keyof DepEvents, Param extends DepEvents[Name]>(eventName: Name, ...args: Param) {
    return super.emit(eventName, ...args);
  }

  private enqueueTask(node: MNode, target: Target, depExtendedData: DepExtendedData, deep: boolean) {
    this.idleTask.enqueueTask(
      ({ node, deep, target }) => {
        this.collectNode(node, target, depExtendedData, deep);
      },
      {
        node,
        deep: false,
        target,
      },
      target.type === DepTargetType.DATA_SOURCE,
    );

    if (deep && Array.isArray(node.items) && node.items.length) {
      node.items.forEach((item) => {
        this.enqueueTask(item, target, depExtendedData, deep);
      });
    }
  }
}

export type DepService = Dep;

export default new Dep();
