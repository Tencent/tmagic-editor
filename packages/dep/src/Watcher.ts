import { isObject } from '@tmagic/utils';

import type Target from './Target';
import { DepTargetType, type TargetList } from './types';

export default class Watcher {
  private targetsList: TargetList = {};

  constructor(options?: { initialTargets?: TargetList }) {
    if (options?.initialTargets) {
      this.targetsList = options.initialTargets;
    }
  }

  public getTargetsList() {
    return this.targetsList;
  }

  /**
   * 获取指定类型中的所有target
   * @param type 分类
   * @returns Target[]
   */
  public getTargets(type: string = DepTargetType.DEFAULT) {
    return this.targetsList[type] || {};
  }

  /**
   * 添加新的目标
   * @param target Target
   */
  public addTarget(target: Target) {
    const targets = this.getTargets(target.type) || {};
    this.targetsList[target.type] = targets;
    targets[target.id] = target;
  }

  /**
   * 获取指定id的target
   * @param id target id
   * @returns Target
   */
  public getTarget(id: string | number, type: string = DepTargetType.DEFAULT) {
    return this.getTargets(type)[id];
  }

  /**
   * 判断是否存在指定id的target
   * @param id target id
   * @returns boolean
   */
  public hasTarget(id: string | number, type: string = DepTargetType.DEFAULT) {
    return Boolean(this.getTarget(id, type));
  }

  /**
   * 判断是否存在指定类型的target
   * @param type target type
   * @returns boolean
   */
  public hasSpecifiedTypeTarget(type: string = DepTargetType.DEFAULT): boolean {
    return Object.keys(this.getTargets(type)).length > 0;
  }

  /**
   * 删除指定id的target
   * @param id target id
   */
  public removeTarget(id: string | number, type: string = DepTargetType.DEFAULT) {
    const targets = this.getTargets(type);
    if (targets[id]) {
      targets[id].destroy();
      delete targets[id];
    }
  }

  /**
   * 删除指定分类的所有target
   * @param type 分类
   * @returns void
   */
  public removeTargets(type: string = DepTargetType.DEFAULT) {
    const targets = this.targetsList[type];

    if (!targets) return;

    for (const target of Object.values(targets)) {
      target.destroy();
    }

    delete this.targetsList[type];
  }

  /**
   * 删除所有target
   */
  public clearTargets() {
    Object.keys(this.targetsList).forEach((key) => {
      delete this.targetsList[key];
    });
  }

  /**
   * 收集依赖
   * @param nodes 需要收集的节点
   * @param deep 是否需要收集子节点
   * @param type 强制收集指定类型的依赖
   */
  public collect(nodes: Record<string | number, any>[], deep = false, type?: DepTargetType) {
    Object.values(this.targetsList).forEach((targets) => {
      Object.values(targets).forEach((target) => {
        if ((!type && !target.isCollectByDefault) || (type && target.type !== type)) return;
        nodes.forEach((node) => {
          // 先删除原有依赖，重新收集
          target.removeDep(node);
          this.collectItem(node, target, deep);
        });
      });
    });
  }

  /**
   * 清除所有目标的依赖
   * @param nodes 需要清除依赖的节点
   */
  public clear(nodes?: Record<string | number, any>[]) {
    const clearedItemsNodeIds: (string | number)[] = [];
    Object.values(this.targetsList).forEach((targets) => {
      Object.values(targets).forEach((target) => {
        if (nodes) {
          nodes.forEach((node) => {
            target.removeDep(node);

            if (Array.isArray(node.items) && node.items.length && !clearedItemsNodeIds.includes(node.id)) {
              clearedItemsNodeIds.push(node.id);
              this.clear(node.items);
            }
          });
        } else {
          target.removeDep();
        }
      });
    });
  }

  /**
   * 清除指定类型的依赖
   * @param type 类型
   * @param nodes 需要清除依赖的节点
   */
  public clearByType(type: DepTargetType, nodes?: Record<string | number, any>[]) {
    const clearedItemsNodeIds: (string | number)[] = [];
    const targetList = this.getTargets(type);
    Object.values(targetList).forEach((target) => {
      if (nodes) {
        nodes.forEach((node) => {
          target.removeDep(node);
          if (Array.isArray(node.items) && node.items.length && !clearedItemsNodeIds.includes(node.id)) {
            clearedItemsNodeIds.push(node.id);
            this.clear(node.items);
          }
        });
      } else {
        target.removeDep();
      }
    });
  }

  private collectItem(node: Record<string | number, any>, target: Target, deep = false) {
    const collectTarget = (config: Record<string | number, any>, prop = '') => {
      const doCollect = (key: string, value: any) => {
        const keyIsItems = key === 'items';
        const fullKey = prop ? `${prop}.${key}` : key;

        if (target.isTarget(fullKey, value)) {
          target.updateDep(node, fullKey);
        } else if (!keyIsItems && Array.isArray(value)) {
          value.forEach((item, index) => {
            if (isObject(item)) {
              collectTarget(item, `${fullKey}[${index}]`);
            }
          });
        } else if (isObject(value)) {
          collectTarget(value, fullKey);
        }

        if (keyIsItems && deep && Array.isArray(value)) {
          value.forEach((child) => {
            this.collectItem(child, target, deep);
          });
        }
      };

      Object.entries(config).forEach(([key, value]) => {
        if (typeof value === 'undefined' || value === '') return;
        doCollect(key, value);
      });
    };

    collectTarget(node);
  }
}
