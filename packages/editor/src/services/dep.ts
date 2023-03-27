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
import { EventEmitter } from 'events';

import { reactive } from 'vue';

import { MNode } from '@tmagic/schema';

type IsTarget = (key: string | number, value: any) => boolean;

interface TargetOptions {
  isTarget: IsTarget;
  id: string | number;
  type?: string;
  name: string;
}

interface Dep {
  [key: string | number]: {
    name: string;
    keys: (string | number)[];
  };
}

interface TargetList {
  [key: string]: {
    [key: string | number]: Target;
  };
}

/**
 * 需要收集依赖的目标
 * 例如：一个代码块可以为一个目标
 */
export class Target extends EventEmitter {
  /**
   * 如何识别目标
   */
  public isTarget: IsTarget;
  /**
   * 目标id，不可重复
   * 例如目标是代码块，则为代码块id
   */
  public id: string | number;
  /**
   * 目标名称，用于显示在依赖列表中
   */
  public name: string;
  /**
   * 不同的目标可以进行分类，例如代码块，数据源可以为两个不同的type
   */
  public type = 'default';
  /**
   * 依赖详情
   * 实例：{ 'node_id': { name: 'node_name', keys: [ created, mounted ] } }
   */
  public deps = reactive<Dep>({});

  constructor(options: TargetOptions) {
    super();
    this.isTarget = options.isTarget;
    this.id = options.id;
    this.name = options.name;
    if (options.type) {
      this.type = options.type;
    }
  }

  /**
   * 更新依赖
   * @param node 节点配置
   * @param key 哪个key配置了这个目标的id
   */
  public updateDep(node: MNode, key: string | number) {
    const dep = this.deps[node.id] || {
      name: node.name,
      keys: [],
    };

    if (node.name) {
      dep.name = node.name;
    }

    this.deps[node.id] = dep;

    if (dep.keys.indexOf(key) === -1) {
      dep.keys.push(key);
    }

    this.emit('change');
  }

  /**
   * 删除依赖
   * @param node 哪个节点的依赖需要移除，如果为空，则移除所有依赖
   * @param key 节点下哪个key需要移除，如果为空，则移除改节点下的所有依赖key
   * @returns void
   */
  public removeDep(node?: MNode, key?: string | number) {
    if (!node) {
      Object.keys(this.deps).forEach((depKey) => {
        delete this.deps[depKey];
      });
      this.emit('change');
      return;
    }

    const dep = this.deps[node.id];

    if (!dep) return;

    if (key) {
      const index = dep.keys.indexOf(key);
      dep.keys.splice(index, 1);

      if (dep.keys.length === 0) {
        delete this.deps[node.id];
      }
    } else {
      delete this.deps[node.id];
    }

    this.emit('change');
  }

  /**
   * 判断指定节点下的指定key是否存在在依赖列表中
   * @param node 哪个节点
   * @param key 哪个key
   * @returns boolean
   */
  public hasDep(node: MNode, key: string | number) {
    const dep = this.deps[node.id];

    return Boolean(dep?.keys.find((d) => d === key));
  }

  public destroy() {
    this.removeAllListeners();
  }
}

export class Watcher extends EventEmitter {
  public targets = reactive<TargetList>({});

  /**
   * 获取指定类型中的所有target
   * @param type 分类
   * @returns Target[]
   */
  public getTargets(type = 'default') {
    return this.targets[type] || {};
  }

  /**
   * 添加新的目标
   * @param target Target
   */
  public addTarget(target: Target) {
    const targets = this.getTargets(target.type) || {};
    this.targets[target.type] = targets;
    targets[target.id] = target;

    this.emit('add-target', target);
  }

  /**
   * 获取指定id的target
   * @param id target id
   * @returns Target
   */
  public getTarget(id: string | number) {
    const allTargets = Object.values(this.targets);
    for (const targets of allTargets) {
      if (targets[id]) {
        return targets[id];
      }
    }
  }

  /**
   * 判断是否存在指定id的target
   * @param id target id
   * @returns boolean
   */
  public hasTarget(id: string | number) {
    const allTargets = Object.values(this.targets);
    for (const targets of allTargets) {
      if (targets[id]) {
        return true;
      }
    }

    return false;
  }

  /**
   * 删除指定id的target
   * @param id target id
   */
  public removeTarget(id: string | number) {
    const allTargets = Object.values(this.targets);
    for (const targets of allTargets) {
      if (targets[id]) {
        targets[id].destroy();
        delete targets[id];
      }
    }

    this.emit('remove-target');
  }

  /**
   * 删除指定分类的所有target
   * @param type 分类
   * @returns void
   */
  public removeTargets(type = 'default') {
    const targets = this.targets[type];

    if (!targets) return;

    for (const target of Object.values(targets)) {
      target.destroy();
    }

    delete this.targets[type];

    this.emit('remove-target');
  }

  /**
   * 删除所有target
   */
  public clearTargets() {
    Object.keys(this.targets).forEach((key) => {
      delete this.targets[key];
    });
  }

  /**
   * 收集依赖
   * @param nodes 需要收集的节点
   * @param deep 是否需要收集子节点
   */
  public collect(nodes: MNode[], deep = false) {
    Object.values(this.targets).forEach((targets) => {
      Object.values(targets).forEach((target) => {
        nodes.forEach((node) => {
          target.removeDep(node);
          this.collectItem(node, target, deep);
        });
      });
    });
  }

  /**
   * 清除依赖
   * @param nodes 需要清除依赖的节点
   */
  public clear(nodes?: MNode[]) {
    Object.values(this.targets).forEach((targets) => {
      Object.values(targets).forEach((target) => {
        if (nodes) {
          nodes.forEach((node) => {
            target.removeDep(node);

            if (Array.isArray(node.items)) {
              this.clear(node.items);
            }
          });
        } else {
          target.removeDep();
        }
      });
    });
  }

  private collectItem(node: MNode, target: Target, deep = false) {
    const collectTarget = (config: Record<string | number, any>, prop = '') => {
      const doCollect = (key: string, value: any) => {
        const keyIsItems = key === 'items';
        const fullKey = prop ? `${prop}.${key}` : key;

        if (target.isTarget(key, value)) {
          target.updateDep(node, fullKey);
        } else if (!keyIsItems && Array.isArray(value)) {
          value.forEach((item, index) => {
            collectTarget(item, `${fullKey}.${index}`);
          });
        } else if (Object.prototype.toString.call(value) === '[object Object]') {
          collectTarget(value, fullKey);
        }

        if (keyIsItems && deep && Array.isArray(value)) {
          value.forEach((child) => {
            this.collectItem(child, target, deep);
          });
        }
      };

      Object.entries(config).forEach(([key, value]) => {
        doCollect(key, value);
      });
    };

    collectTarget(node);
  }
}

export type DepService = Watcher;

export default new Watcher();
