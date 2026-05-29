import { NODE_DISABLE_CODE_BLOCK_KEY, NODE_DISABLE_DATA_SOURCE_KEY } from '@tmagic/schema';
import { isObject } from '@tmagic/utils';

import type Target from './Target';
import { type DepExtendedData, DepTargetType, type TargetList, TargetNode } from './types';
import { traverseTarget } from './utils';

const DATA_SOURCE_TARGET_TYPES: Set<string> = new Set([
  DepTargetType.DATA_SOURCE,
  DepTargetType.DATA_SOURCE_COND,
  DepTargetType.DATA_SOURCE_METHOD,
]);

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
    for (const key of Object.keys(this.targetsList)) {
      delete this.targetsList[key];
    }
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
    const targets = this.getCollectableTargets(type);

    if (!targets.length) {
      return;
    }

    // 整棵树只遍历一次、在每个属性上检查所有 target，把结构遍历开销从 ×targets 降到 ×1（详见 collectItems）
    for (const node of nodes) {
      this.removeTargetsDep(targets, node);
      this.collectItems(node, targets, depExtendedData, deep);
    }
  }

  /**
   * 获取本次需要参与收集的 target（过滤规则与 collectByCallback 一致）
   *
   * 注：供 editor 的 dep service / worker 跨包批量收集时复用，因此为 public。
   * @param type 强制收集指定类型的依赖
   */
  public getCollectableTargets(type?: DepTargetType | string): Target[] {
    const targets: Target[] = [];
    traverseTarget(
      this.targetsList,
      (target) => {
        if (!type && !target.isCollectByDefault) {
          return;
        }
        targets.push(target);
      },
      type,
    );
    return targets;
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
        for (const node of nodes) {
          cb({ node, target });
        }
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

    const clearedItemsNodeIds = new Set<string | number>();
    traverseTarget(targetsList, (target) => {
      if (nodes) {
        for (const node of nodes) {
          target.removeDep(node[this.idProp]);

          if (
            Array.isArray(node[this.childrenProp]) &&
            node[this.childrenProp].length &&
            !clearedItemsNodeIds.has(node[this.idProp])
          ) {
            clearedItemsNodeIds.add(node[this.idProp]);
            this.clear(node[this.childrenProp]);
          }
        }
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

  /**
   * 收集单个 target 的依赖，等价于 collectItems(node, [target], ...)
   */
  public collectItem(node: TargetNode, target: Target, depExtendedData: DepExtendedData = {}, deep = false) {
    this.collectItems(node, [target], depExtendedData, deep);
  }

  public removeTargetDep(target: Target, node: TargetNode, key?: string | number) {
    target.removeDep(node[this.idProp], key);
    if (typeof key === 'undefined' && Array.isArray(node[this.childrenProp]) && node[this.childrenProp].length) {
      for (const item of node[this.childrenProp] as TargetNode[]) {
        this.removeTargetDep(target, item, key);
      }
    }
  }

  /**
   * 与 removeTargetDep 等价，但一次子树递归同时处理多个 target，
   * 把删除阶段的结构遍历从 ×targets 降到 ×1。
   *
   * 注：供 editor 的 dep service 跨包批量删除时复用，因此为 public。
   */
  public removeTargetsDep(targets: Target[], node: TargetNode, key?: string | number) {
    const id = node[this.idProp];
    for (const target of targets) {
      target.removeDep(id, key);
    }
    if (typeof key === 'undefined' && Array.isArray(node[this.childrenProp]) && node[this.childrenProp].length) {
      for (const item of node[this.childrenProp] as TargetNode[]) {
        this.removeTargetsDep(targets, item, key);
      }
    }
  }

  /**
   * 与 collectItem 等价，但一次遍历同时处理多个 target（不含删除阶段）。
   *
   * 关键优化：原实现对每个 target 都完整遍历一遍节点树（O(targets × 树规模)），大页面 + 大量数据源时，
   * 结构遍历（Object.entries / 递归 / fullKey 字符串拼接）会被重复 targets 次。这里改为「整棵树只遍历一次，
   * 在每个属性上检查所有 target」，把结构遍历开销从 ×targets 降到 ×1，isTarget 调用次数不变，收集结果完全一致。
   *
   * 注：供 editor 的 dep service / worker 跨包批量收集时复用，因此为 public。
   */
  public collectItems(node: TargetNode, targets: Target[], depExtendedData: DepExtendedData = {}, deep = false) {
    // 对应 collectItem 开头的 NODE_DISABLE_* 判断：被禁用的 target 在该节点及其子树都不收集
    const activeTargets = this.filterTargetsByNode(node, targets);

    if (!activeTargets.length) {
      return;
    }

    this.collectTargetForTargets(node, node, '', activeTargets, depExtendedData, deep);
  }

  private filterTargetsByNode(node: TargetNode, targets: Target[]): Target[] {
    const disableDataSource = Boolean(node[NODE_DISABLE_DATA_SOURCE_KEY]);
    const disableCodeBlock = Boolean(node[NODE_DISABLE_CODE_BLOCK_KEY]);

    if (!disableDataSource && !disableCodeBlock) {
      return targets;
    }

    return targets.filter((target) => {
      if (disableDataSource && DATA_SOURCE_TARGET_TYPES.has(target.type)) {
        return false;
      }
      if (disableCodeBlock && target.type === DepTargetType.CODE_BLOCK) {
        return false;
      }
      return true;
    });
  }

  private collectTargetForTargets(
    node: TargetNode,
    config: Record<string | number, any>,
    prop: string,
    targets: Target[],
    depExtendedData: DepExtendedData,
    deep: boolean,
  ) {
    const id = node[this.idProp];
    const name = `${node[this.nameProp] || node[this.idProp]}`;

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'undefined' || value === '') continue;

      const keyIsItems = key === this.childrenProp;
      const fullKey = prop ? `${prop}.${key}` : key;

      // 在该属性上检查所有 target：命中的更新依赖；未命中的留待递归到更深层
      let notMatched: Target[] | null = null;
      for (let i = 0, l = targets.length; i < l; i++) {
        const target = targets[i];
        if (target.isTarget(fullKey, value, config)) {
          target.updateDep({
            id,
            name,
            data: depExtendedData,
            key: fullKey,
          });
        } else {
          (notMatched || (notMatched = [])).push(target);
        }
      }

      // 对应原 doCollect 的 else-if 分支：仅未命中的 target 才继续往 value 内部递归
      if (notMatched) {
        if (!keyIsItems && Array.isArray(value)) {
          for (let i = 0, l = value.length; i < l; i++) {
            const item = value[i];
            if (isObject(item)) {
              this.collectTargetForTargets(node, item, `${fullKey}[${i}]`, notMatched, depExtendedData, deep);
            }
          }
        } else if (isObject(value)) {
          this.collectTargetForTargets(node, value, fullKey, notMatched, depExtendedData, deep);
        }
      }

      // 对应原 doCollect 末尾的无条件子节点递归
      if (keyIsItems && deep && Array.isArray(value)) {
        for (const child of value) {
          this.collectItems(child, targets, depExtendedData, deep);
        }
      }
    }
  }
}
