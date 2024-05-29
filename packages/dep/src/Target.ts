import type { DepData } from '@tmagic/schema';

import { DepTargetType, type IsTarget, type TargetOptions } from './types';

export interface DepUpdateOptions {
  id: string | number;
  name: string;
  key: string | number;
  data: Record<string, any>;
}

/**
 * 需要收集依赖的目标
 * 例如：一个代码块可以为一个目标
 */
export default class Target {
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
  public name?: string;
  /**
   * 不同的目标可以进行分类，例如代码块，数据源可以为两个不同的type
   */
  public type: string = DepTargetType.DEFAULT;
  /**
   * 依赖详情
   * 实例：{ 'node_id': { name: 'node_name', keys: [ created, mounted ] } }
   */
  public deps: DepData = {};
  /**
   * 是否默认收集，默认为true，当值为false时需要传入type参数给collect方法才会被收集
   */
  public isCollectByDefault?: boolean;

  constructor(options: TargetOptions) {
    this.isTarget = options.isTarget;
    this.id = options.id;
    this.name = options.name;
    this.isCollectByDefault = options.isCollectByDefault ?? true;
    if (options.type) {
      this.type = options.type;
    }
    if (options.initialDeps) {
      this.deps = options.initialDeps;
    }
  }

  /**
   * 更新依赖
   * @param option 节点配置
   * @param key 哪个key配置了这个目标的id
   */
  public updateDep({ id, name, key, data }: DepUpdateOptions) {
    const dep = this.deps[id] || {
      name,
      keys: [],
    };

    dep.name = name;

    dep.data = data;

    this.deps[id] = dep;

    if (dep.keys.indexOf(key) === -1) {
      dep.keys.push(key);
    }
  }

  /**
   * 删除依赖
   * @param node 哪个节点的依赖需要移除，如果为空，则移除所有依赖
   * @param key 节点下哪个key需要移除，如果为空，则移除改节点下的所有依赖key
   * @returns void
   */
  public removeDep(id?: string | number, key?: string | number) {
    if (typeof id === 'undefined') {
      Object.keys(this.deps).forEach((depKey) => {
        delete this.deps[depKey];
      });
      return;
    }

    const dep = this.deps[id];

    if (!dep) return;

    if (key) {
      const index = dep.keys.indexOf(key);
      dep.keys.splice(index, 1);

      if (dep.keys.length === 0) {
        delete this.deps[id];
      }
    } else {
      delete this.deps[id];
    }
  }

  /**
   * 判断指定节点下的指定key是否存在在依赖列表中
   * @param node 哪个节点
   * @param key 哪个key
   * @returns boolean
   */
  public hasDep(id: string | number, key: string | number) {
    const dep = this.deps[id];

    return Boolean(dep?.keys.find((d) => d === key));
  }

  public destroy() {
    this.deps = {};
  }
}
