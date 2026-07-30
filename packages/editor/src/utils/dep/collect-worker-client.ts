import serialize from 'serialize-javascript';

import type { Id, MApp } from '@tmagic/core';

import { error } from '../logger';

import type { CollectWorkerPayload, CollectWorkerRequest, CollectWorkerResponse, DepsData } from './worker';
import CollectWorker from './worker.ts?worker&inline';

export interface CollectWorkerResult {
  deps: DepsData;
  nodeIds: Id[];
}

/**
 * 依赖收集 worker 的主线程客户端
 *
 * 依赖收集需要深度遍历整棵节点树并对每个属性做匹配，节点/数据源多时会长时间占用主线程导致页面卡死，
 * 这里把遍历匹配放到 worker 中执行，主线程只负责把结果写回 target。
 *
 * 全量收集与增量收集共用一个常驻 worker：增量收集调用频繁（每次节点更新都会触发），
 * 按次创建 worker 的启动开销无法接受，也容易漏掉销毁导致线程泄漏。
 */
export class CollectWorkerClient {
  private worker: Worker | null = null;

  private seed = 0;

  private pending = new Map<number, (response: CollectWorkerResponse | null) => void>();

  public get isSupported() {
    return typeof Worker !== 'undefined';
  }

  /**
   * 在 worker 中全量收集整个 DSL 的依赖，target 由 worker 根据 DSL 重建
   * @returns 收集结果，返回 null 表示 worker 不可用或执行失败
   */
  public collectDsl(dsl: MApp): Promise<DepsData | null> {
    return this.request((id) => ({ id, dsl: serialize(dsl) })).then((response) => response?.deps || null);
  }

  /**
   * 在 worker 中增量收集指定节点的依赖，target 以可序列化描述的形式传入
   * @returns 收集结果，返回 null 表示 worker 不可用或执行失败，调用方需要回退到主线程收集
   */
  public collect(payload: CollectWorkerPayload): Promise<CollectWorkerResult | null> {
    return this.request((id) => ({ id, payload: serialize(payload) })).then((response) =>
      response ? { deps: response.deps || {}, nodeIds: response.nodeIds || [] } : null,
    );
  }

  public terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.settleAllPending();
  }

  /**
   * 丢弃在途请求并重建 worker
   * clearIdleTasks / reset 中断收集时调用，避免已 abort 的长任务继续占着常驻 worker 拖慢后续收集
   */
  public abort() {
    this.terminate();
  }

  /**
   * worker 按收到的顺序逐个处理请求，因此请求间不会互相打断，用 id 把结果分发回各自的调用方
   */
  private request(createRequest: (id: number) => CollectWorkerRequest): Promise<CollectWorkerResponse | null> {
    const worker = this.getWorker();

    if (!worker) {
      return Promise.resolve(null);
    }

    this.seed += 1;
    const id = this.seed;

    return new Promise<CollectWorkerResponse | null>((resolve) => {
      this.pending.set(id, resolve);

      try {
        // 节点配置中可能存在函数等无法结构化克隆的值，需要先序列化再传递
        worker.postMessage(createRequest(id));
      } catch (e) {
        error('magic editor: 依赖收集 worker 通信失败', e);
        this.pending.delete(id);
        resolve(null);
      }
    });
  }

  private getWorker() {
    if (!this.isSupported) {
      return null;
    }

    if (this.worker) {
      return this.worker;
    }

    try {
      const worker: Worker = new CollectWorker();
      worker.onmessage = (e: MessageEvent<CollectWorkerResponse>) => {
        this.handleResponse(e.data);
      };
      // worker 整体异常时无法定位到具体请求，只能结算全部在途请求并重建 worker
      worker.onerror = () => {
        this.handleFatalError();
      };
      worker.onmessageerror = () => {
        this.handleFatalError();
      };
      this.worker = worker;
    } catch (e) {
      error('magic editor: 依赖收集 worker 创建失败', e);
      return null;
    }

    return this.worker;
  }

  private handleResponse(response: CollectWorkerResponse) {
    const resolve = this.pending.get(response?.id);

    if (!resolve) {
      return;
    }

    this.pending.delete(response.id);
    resolve(response.failed ? null : response);
  }

  private handleFatalError() {
    this.worker?.terminate();
    this.worker = null;
    this.settleAllPending();
  }

  private settleAllPending() {
    const resolvers = [...this.pending.values()];
    this.pending.clear();

    for (const resolve of resolvers) {
      resolve(null);
    }
  }
}
