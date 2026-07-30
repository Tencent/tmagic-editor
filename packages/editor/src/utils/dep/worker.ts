import {
  createCodeBlockTarget,
  createDataSourceCondTarget,
  createDataSourceMethodTarget,
  createDataSourceTarget,
  createTargetByDescriptor,
  type DepData,
  type DepExtendedData,
  DepTargetType,
  type Id,
  type MApp,
  type TargetDescriptor,
  type TargetNode,
  traverseTarget,
  Watcher,
} from '@tmagic/core';

import { error } from '../logger';

export type DepsData = Record<string, Record<Id, DepData>>;

/** 全量收集请求：worker 中根据 DSL 重建代码块/数据源 target */
export interface DslCollectRequest {
  /** 请求 id，用于把结果与调用方对应起来 */
  id: number;
  /** serialize-javascript 序列化后的 MApp */
  dsl: string;
}

export interface CollectWorkerPayload {
  /** 待收集的节点 */
  nodes: TargetNode[];
  /** 参与本次收集的 target 描述，worker 中据此重建 target */
  targets: TargetDescriptor[];
  depExtendedData: DepExtendedData;
  deep: boolean;
}

/** 增量收集请求：target 由主线程以可序列化描述的形式传入 */
export interface NodesCollectRequest {
  id: number;
  /** serialize-javascript 序列化后的 CollectWorkerPayload */
  payload: string;
}

export type CollectWorkerRequest = DslCollectRequest | NodesCollectRequest;

export interface CollectWorkerResponse {
  id: number;
  /** 收集结果，结构为 { [target.type]: { [target.id]: deps } } */
  deps: DepsData;
  /** 增量收集时本次覆盖到的节点 id（deep=true 时含子孙），主线程据此删除旧依赖 */
  nodeIds?: Id[];
  /** 收集失败，调用方需要回退到主线程收集 */
  failed?: boolean;
}

/**
 * 收集本次会覆盖到的节点 id
 * 必须与 deep 一致：deep=false 时不能带上子孙 id，否则写回阶段 removeDep 会清掉未重收的子节点依赖
 */
const getNodeIds = (nodes: TargetNode[], deep: boolean, ids: Id[] = []) => {
  for (const node of nodes) {
    ids.push(node.id);

    if (deep && Array.isArray(node.items) && node.items.length) {
      getNodeIds(node.items, deep, ids);
    }
  }

  return ids;
};

const collectDsl = ({ id, dsl }: DslCollectRequest) => {
  try {
    // eslint-disable-next-line no-eval
    const mApp: MApp = eval(`(${dsl})`);

    if (!mApp) {
      postMessage({ id, deps: {} });
      return;
    }

    const watcher = new Watcher({ initialTargets: {} });

    if (mApp.codeBlocks) {
      for (const [id, code] of Object.entries(mApp.codeBlocks)) {
        watcher.addTarget(createCodeBlockTarget(id, code));
      }
    }

    if (mApp.dataSources) {
      for (const ds of mApp.dataSources) {
        watcher.addTarget(createDataSourceTarget(ds, {}));
        watcher.addTarget(createDataSourceMethodTarget(ds, {}));
        watcher.addTarget(createDataSourceCondTarget(ds, {}));
      }
    }

    // worker 中 target 均为新建（deps 为空），无需删除阶段，直接批量收集
    const targets = watcher.getCollectableTargets();
    for (const page of mApp.items) {
      watcher.collectItems(page, targets, { pageId: page.id }, true);
    }

    const deps: DepsData = {
      [DepTargetType.DATA_SOURCE]: {},
      [DepTargetType.DATA_SOURCE_METHOD]: {},
      [DepTargetType.DATA_SOURCE_COND]: {},
      [DepTargetType.CODE_BLOCK]: {},
    };

    traverseTarget(watcher.getTargetsList(), (target) => {
      deps[target.type][target.id] = target.deps;
    });

    const response: CollectWorkerResponse = { id, deps };
    postMessage(response);
  } catch (e: any) {
    error(e);
    const response: CollectWorkerResponse = { id, deps: {}, failed: true };
    postMessage(response);
  }
};

const collectNodes = ({ id, payload }: NodesCollectRequest) => {
  try {
    // eslint-disable-next-line no-eval
    const { nodes, targets: descriptors, depExtendedData, deep }: CollectWorkerPayload = eval(`(${payload})`);

    const watcher = new Watcher({ initialTargets: {} });
    // worker 中 target 均为新建（deps 为空），无需删除阶段，直接批量收集
    const targets = descriptors.map((descriptor) => createTargetByDescriptor(descriptor));

    for (const node of nodes) {
      watcher.collectItems(node, targets, depExtendedData, deep);
    }

    const deps: DepsData = {};
    for (const target of targets) {
      if (!deps[target.type]) {
        deps[target.type] = {};
      }
      deps[target.type][target.id] = target.deps;
    }

    const response: CollectWorkerResponse = { id, deps, nodeIds: getNodeIds(nodes, deep) };
    postMessage(response);
  } catch (e: any) {
    error(e);
    const response: CollectWorkerResponse = { id, deps: {}, nodeIds: [], failed: true };
    postMessage(response);
  }
};

/**
 * 依赖收集 worker
 *
 * 依赖收集需要深度遍历整棵节点树并对每个属性做 target 匹配，节点/数据源多时会长时间占用主线程导致页面卡死，
 * 因此把遍历匹配放到 worker 中执行。
 * 全量与增量收集共用一个常驻 worker：收集逻辑只打进一份 inline worker 产物，
 * 也不会因为频繁收集而反复创建线程，每个请求用 id 与调用方对应。
 */
onmessage = (e: MessageEvent<CollectWorkerRequest>) => {
  if ('dsl' in e.data) {
    collectDsl(e.data);
    return;
  }

  collectNodes(e.data);
};
