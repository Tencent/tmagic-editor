import serialize from 'serialize-javascript';

import type { Id, MApp } from '@tmagic/core';

import { error } from '../logger';

import type { CollectWorkerPayload, CollectWorkerRequest, CollectWorkerResponse, DepsData } from './worker';
import CollectWorker from './worker.ts?worker&inline';

export interface CollectWorkerResult {
  deps: DepsData;
  nodeIds: Id[];
}

interface CollectTask {
  id: number;
  createRequest: (id: number) => CollectWorkerRequest;
  resolve: (response: CollectWorkerResponse | null) => void;
  /** 已被 abort 丢弃：调用方已按 null 结算，结果回来后不再回传 */
  discarded: boolean;
}

/**
 * 依赖收集 worker 的主线程客户端
 *
 * 依赖收集需要深度遍历整棵节点树并对每个属性做匹配，节点/数据源多时会长时间占用主线程导致页面卡死，
 * 这里把遍历匹配放到 worker 中执行，主线程只负责把结果写回 target。
 *
 * 全量收集与增量收集共用一个常驻 worker：增量收集调用频繁（每次节点更新都会触发），
 * 按次创建 worker 的启动开销无法接受，也容易漏掉销毁导致线程泄漏。
 *
 * 请求在主线程侧排队后逐个投递（worker 本身也是串行处理），这样 abort 时能直接丢掉尚未投递的请求，
 * 无需销毁线程：worker 只在真正异常或销毁时才重建。
 */
export class CollectWorkerClient {
  private worker: Worker | null = null;

  private seed = 0;

  /** 等待投递给 worker 的请求 */
  private queue: CollectTask[] = [];

  /** 已投递、等待 worker 响应的请求，worker 串行处理，同一时刻最多一个 */
  private inflight: CollectTask | null = null;

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
    this.settleAll();
  }

  /**
   * 丢弃在途请求，但保留常驻 worker
   *
   * clearIdleTasks / reset 中断收集时调用。这里不能销毁 worker：worker 重建要重新加载并启动整份收集逻辑，
   * 而 clearIdleTasks / reset 触发频繁（root 更新、数据源变更、历史回滚等），一旦下一次 abort 落在
   * 上一个 worker 还没启动完的窗口内，就会陷入「加载中被销毁 → 重建 → 又被销毁」的循环，
   * 表现为 worker 反复加载且依赖始终收集不完。
   *
   * 因此 abort 只做「不要这些结果」：尚未投递的请求直接丢掉，已投递的那一个标记为丢弃，
   * 结果回来后忽略（不写回主线程），worker 继续复用。
   */
  public abort() {
    const { queue } = this;
    this.queue = [];

    for (const task of queue) {
      task.resolve(null);
    }

    // 已投递的请求无法从外部打断（worker 忙时收不到取消消息），只能丢弃其结果
    if (this.inflight && !this.inflight.discarded) {
      this.inflight.discarded = true;
      this.inflight.resolve(null);
    }
  }

  private request(createRequest: (id: number) => CollectWorkerRequest): Promise<CollectWorkerResponse | null> {
    if (!this.isSupported) {
      return Promise.resolve(null);
    }

    this.seed += 1;
    const id = this.seed;

    return new Promise<CollectWorkerResponse | null>((resolve) => {
      this.queue.push({ id, createRequest, resolve, discarded: false });
      this.flush();
    });
  }

  /**
   * 投递队首请求，worker 串行处理，因此同一时刻只投递一个，用 id 把结果分发回各自的调用方
   */
  private flush() {
    if (this.inflight || !this.queue.length) {
      return;
    }

    const worker = this.getWorker();

    if (!worker) {
      this.settleAll();
      return;
    }

    const task = this.queue.shift()!;
    this.inflight = task;

    try {
      // 节点配置中可能存在函数等无法结构化克隆的值，需要先序列化再传递
      worker.postMessage(task.createRequest(task.id));
    } catch (e) {
      error('magic editor: 依赖收集 worker 通信失败', e);
      this.inflight = null;

      if (!task.discarded) {
        task.resolve(null);
      }

      this.flush();
    }
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
    const task = this.inflight;

    if (task?.id !== response?.id) {
      return;
    }

    this.inflight = null;

    // 被 abort 丢弃的请求已按 null 结算，结果不能再写回主线程
    if (!task.discarded) {
      task.resolve(response.failed ? null : response);
    }

    this.flush();
  }

  private handleFatalError() {
    this.worker?.terminate();
    this.worker = null;
    this.settleAll();
  }

  private settleAll() {
    const tasks = this.queue;
    this.queue = [];

    if (this.inflight) {
      tasks.push(this.inflight);
      this.inflight = null;
    }

    for (const task of tasks) {
      if (!task.discarded) {
        task.resolve(null);
      }
    }
  }
}
