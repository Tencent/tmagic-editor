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

/**
 * 一次 collectIdle 调用对应一个批次。批次自行统计入队/完成的任务数，在自身任务全部完成或被中断时
 * 结算对应的 Promise，避免多次快速触发时共用 idleTask 的 finish 事件造成的串扰、提前 resolve，
 * 以及 clearTasks 后 Promise 永不 resolve（collecting 卡死、监听器泄漏）。
 */
interface CollectBatch {
  nodes: MNode[];
  deep: boolean;
  pending: number;
  dsPending: number;
  collectedEmitted: boolean;
  dsSettled: boolean;
  resolve: (completed: boolean) => void;
}

class Dep extends BaseService {
  private state = shallowReactive<State>({
    collecting: false,
    taskLength: 0,
  });

  private idleTask = new IdleTask<{ node: TargetNode; deep: boolean; target: Target }>();

  private watcher = new Watcher({ initialTargets: reactive({}) });

  private waitingWorker?: Promise<void>;

  private resolveWaitingWorker?: () => void;

  private workerGeneration = 0;

  private activeBatches = new Set<CollectBatch>();

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

    const targets = this.watcher.getCollectableTargets(type);

    if (targets.length) {
      for (const node of nodes) {
        // 先删除原有依赖，再批量收集
        if (isPage(node)) {
          for (const target of targets) {
            this.removePageDep(target, depExtendedData);
          }
        } else {
          this.watcher.removeTargetsDep(targets, node);
        }
        this.watcher.collectItems(node, targets, depExtendedData, deep);
      }
    }

    this.set('collecting', false);

    this.emit('collected', nodes, deep);
    this.emit('ds-collected', nodes, deep);
  }

  public async collectIdle(nodes: MNode[], depExtendedData: DepExtendedData = {}, deep = false, type?: DepTargetType) {
    if (this.waitingWorker) {
      await this.waitingWorker;
    }

    const batch: CollectBatch = {
      nodes,
      deep,
      pending: 0,
      dsPending: 0,
      collectedEmitted: false,
      dsSettled: false,
      resolve: () => {},
    };

    this.watcher.collectByCallback(nodes, type, ({ node, target }) => {
      this.enqueueTask(node, target, depExtendedData, deep, batch);
    });

    // 没有命中任何 target，无需收集，直接完成
    if (batch.pending === 0) {
      this.emit('collected', nodes, deep);
      this.updateCollectingState();
      return true;
    }

    this.activeBatches.add(batch);
    this.set('collecting', true);

    return new Promise<boolean>((resolve) => {
      batch.resolve = resolve;
    });
  }

  public collectByWorker(dsl: MApp) {
    this.set('collecting', true);
    this.workerGeneration += 1;
    const generation = this.workerGeneration;

    const { promise, resolve: waitingResolve } = Promise.withResolvers<void>();

    this.waitingWorker = promise;
    this.resolveWaitingWorker = waitingResolve;

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
      if (generation !== this.workerGeneration) {
        waitingResolve();
        return depsData;
      }

      traverseTarget(this.watcher.getTargetsList(), (target) => {
        if (depsData[target.type]?.[target.id]) {
          target.deps = reactive(depsData[target.type][target.id]);

          if (target.type === DepTargetType.DATA_SOURCE && dsl.dataSourceDeps) {
            dsl.dataSourceDeps[target.id] = target.deps;
          } else if (target.type === DepTargetType.DATA_SOURCE_COND && dsl.dataSourceCondDeps) {
            dsl.dataSourceCondDeps[target.id] = target.deps;
          } else if (target.type === DepTargetType.DATA_SOURCE_METHOD && dsl.dataSourceMethodDeps) {
            dsl.dataSourceMethodDeps[target.id] = target.deps;
          }
        }
      });

      this.set('collecting', false);
      this.emit('collected', dsl.items, true);
      this.emit('ds-collected', dsl.items, true);
      waitingResolve();
      if (this.waitingWorker === promise) {
        this.waitingWorker = undefined;
        this.resolveWaitingWorker = undefined;
      }

      return depsData;
    });
  }

  public collectNode(node: MNode, target: Target, depExtendedData: DepExtendedData = {}, deep = false) {
    // 先删除原有依赖，重新收集
    if (isPage(node)) {
      this.removePageDep(target, depExtendedData);
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
    this.abortActiveBatches();
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
    this.abortActiveBatches();
    this.workerGeneration += 1;
    this.resolveWaitingWorker?.();
    this.resolveWaitingWorker = undefined;
    this.waitingWorker = undefined;
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

  /**
   * 删除指定 page 在该 target 下的旧依赖：
   * 按 pageId 匹配，可清掉页面内已被删除节点的残留依赖
   */
  private removePageDep(target: Target, depExtendedData: DepExtendedData = {}) {
    for (const depKey of Object.keys(target.deps)) {
      const dep = target.deps[depKey];
      if (dep.data?.pageId && dep.data.pageId === depExtendedData.pageId) {
        delete target.deps[depKey];
      }
    }
  }

  private enqueueTask(
    node: MNode,
    target: Target,
    depExtendedData: DepExtendedData,
    deep: boolean,
    batch: CollectBatch,
  ) {
    const isDataSource = target.type === DepTargetType.DATA_SOURCE;

    batch.pending += 1;
    if (isDataSource) {
      batch.dsPending += 1;
    }

    this.idleTask.enqueueTask(
      ({ node, deep, target }) => {
        try {
          this.collectNode(node, target, depExtendedData, deep);
        } finally {
          this.onBatchTaskDone(batch, isDataSource);
        }
      },
      {
        node,
        deep: false,
        target,
      },
      isDataSource,
    );

    if (deep && Array.isArray(node.items) && node.items.length) {
      node.items.forEach((item) => {
        this.enqueueTask(item, target, depExtendedData, deep, batch);
      });
    }
  }

  private onBatchTaskDone(batch: CollectBatch, isDataSource: boolean) {
    if (isDataSource) {
      batch.dsPending -= 1;
      // 数据源依赖收集完先 resolve，让 stage 尽快更新，其余依赖继续在后台收集
      if (batch.dsPending === 0) {
        this.settleBatchDs(batch);
      }
    }

    batch.pending -= 1;
    if (batch.pending === 0) {
      this.finishBatch(batch);
    }
  }

  private settleBatchDs(batch: CollectBatch) {
    if (batch.dsSettled) return;
    batch.dsSettled = true;
    this.emit('ds-collected', batch.nodes, batch.deep);
    batch.resolve(true);
  }

  private finishBatch(batch: CollectBatch) {
    if (!batch.collectedEmitted) {
      batch.collectedEmitted = true;
      this.emit('collected', batch.nodes, batch.deep);
    }
    // 没有数据源任务的批次在此结算 Promise
    this.settleBatchDs(batch);
    this.activeBatches.delete(batch);
    this.updateCollectingState();
  }

  /**
   * idleTask 被清空时，在途批次的任务不会再执行，必须主动结算，
   * 否则对应的 collectIdle Promise 永远不会 resolve（collecting 卡在 true、once 监听器泄漏）。
   * 收集被中断（通常紧跟一次全量重新收集），因此不再 emit collected/ds-collected，仅结算 Promise。
   */
  private abortActiveBatches() {
    if (!this.activeBatches.size) {
      return;
    }

    const batches = [...this.activeBatches];
    this.activeBatches.clear();

    for (const batch of batches) {
      batch.resolve(false);
    }

    this.updateCollectingState();
  }

  private updateCollectingState() {
    this.set('collecting', this.activeBatches.size > 0);
  }
}

export type DepService = Dep;

export default new Dep();
