import { isObject } from '@tmagic/utils';

import type Target from './Target';
import { type DepExtendedData, DepTargetType, type TargetList, TargetNode } from './types';
import { traverseTarget } from './utils';

export default class Watcher {
  private targetsList: TargetList = {};
  private childrenProp = 'items';
  private idProp = 'id';
  private nameProp = 'name';

  constructor(options?: { initialTargets?: TargetList; childrenProp?: string }) {
    if (options?.initialTargets) {
      this.targetsList = options.initialTargets;
    }

    if (options?.childrenProp) {
      this.childrenProp = options.childrenProp;
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
  public collect(
    nodes: TargetNode[],
    depExtendedData: DepExtendedData = {},
    deep = false,
    type?: DepTargetType | string,
  ) {
    this.collectByCallback(nodes, type, ({ node, target }) => {
      this.removeTargetDep(target, node);
      this.collectItem(node, target, depExtendedData, deep);
    });
  }

  public collectByCallback(
    nodes: TargetNode[],
    type: DepTargetType | string | undefined,
    cb: (data: { node: TargetNode; target: Target }) => void,
  ) {
    traverseTarget(
      this.targetsList,
      (target) => {
        if (!type && !target.isCollectByDefault) {
          return;
        }
        nodes.forEach((node) => {
          cb({ node, target });
        });
      },
      type,
    );
  }

  /**
   * 清除所有目标的依赖
   * @param nodes 需要清除依赖的节点
   */
  public clear(nodes?: TargetNode[], type?: DepTargetType | string) {
    let { targetsList } = this;

    if (type) {
      targetsList = {
        [type]: this.getTargets(type),
      };
    }

    const clearedItemsNodeIds: (string | number)[] = [];
    traverseTarget(targetsList, (target) => {
      if (nodes) {
        nodes.forEach((node) => {
          target.removeDep(node[this.idProp]);

          if (
            Array.isArray(node[this.childrenProp]) &&
            node[this.childrenProp].length &&
            !clearedItemsNodeIds.includes(node[this.idProp])
          ) {
            clearedItemsNodeIds.push(node[this.idProp]);
            this.clear(node[this.childrenProp]);
          }
        });
      } else {
        target.removeDep();
      }
    });
  }

  /**
   * 清除指定类型的依赖
   * @param type 类型
   * @param nodes 需要清除依赖的节点
   */
  public clearByType(type: DepTargetType | string, nodes?: TargetNode[]) {
    this.clear(nodes, type);
  }

  public collectItem(node: TargetNode, target: Target, depExtendedData: DepExtendedData = {}, deep = false) {
    const collectTarget = (config: Record<string | number, any>, prop = '') => {
      const doCollect = (key: string, value: any) => {
        const keyIsItems = key === this.childrenProp;
        const fullKey = prop ? `${prop}.${key}` : key;

        if (target.isTarget(fullKey, value)) {
          target.updateDep({
            id: node[this.idProp],
            name: `${node[this.nameProp] || node[this.idProp]}`,
            data: depExtendedData,
            key: fullKey,
          });
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
            this.collectItem(child, target, depExtendedData, deep);
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

  public removeTargetDep(target: Target, node: TargetNode, key?: string | number) {
    target.removeDep(node[this.idProp], key);
    if (typeof key === 'undefined' && Array.isArray(node[this.childrenProp]) && node[this.childrenProp].length) {
      node[this.childrenProp].forEach((item: TargetNode) => {
        this.removeTargetDep(target, item, key);
      });
    }
  }
}
