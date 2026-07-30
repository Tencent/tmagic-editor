import type { CodeBlockContent, DataSourceSchema, DepData, Id } from '@tmagic/schema';

import type Target from './Target';

/** 依赖收集的目标类型 */
export enum DepTargetType {
  DEFAULT = 'default',
  /** 代码块 */
  CODE_BLOCK = 'code-block',
  /** 数据源 */
  DATA_SOURCE = 'data-source',
  /** 数据源方法 */
  DATA_SOURCE_METHOD = 'data-source-method',
  /** 数据源条件 */
  DATA_SOURCE_COND = 'data-source-cond',
}

export type IsTarget = (key: string | number, value: any, data?: Record<string, any>) => boolean;

/** 创建代码块 target 只需要名称，Record 用于兼容直接传入完整代码块 */
export type CodeBlockName = Pick<CodeBlockContent, 'name'> & Record<string, any>;

/**
 * target 的可序列化描述
 *
 * isTarget 是带闭包的函数，无法跨线程传递，只能在另一端用同样的入参重新创建。
 * 内置的代码块/数据源 target 由工厂函数写入该描述，因此可以放到 worker 中收集；
 * 业务自定义的 target 没有该描述，只能在主线程收集。
 *
 * 各类型只带 isTarget 真正用到的字段：
 * - CODE_BLOCK: id + name
 * - DATA_SOURCE / DATA_SOURCE_COND: id + 完整 fields（含 type / 嵌套，用于判断数组模板）
 * - DATA_SOURCE_METHOD: id + 方法名/字段名（不序列化 content）
 */
export type TargetDescriptor =
  | { type: DepTargetType.CODE_BLOCK; id: Id; codeBlock: CodeBlockName }
  | { type: DepTargetType.DATA_SOURCE; ds: Pick<DataSourceSchema, 'id' | 'fields'> }
  | { type: DepTargetType.DATA_SOURCE_COND; ds: Pick<DataSourceSchema, 'id' | 'fields'> }
  | {
      type: DepTargetType.DATA_SOURCE_METHOD;
      ds: { id: Id; methods: Array<{ name?: string }>; fields: Array<{ name?: string }> };
    };

export interface TargetOptions {
  isTarget: IsTarget;
  id: string | number;
  /** 类型，数据源、代码块或其他 */
  type?: string;
  name?: string;
  initialDeps?: DepData;
  /** 是否默认收集，默认为true，当值为false时需要传入type参数给collect方法才会被收集 */
  isCollectByDefault?: boolean;
  /** 可序列化描述，用于在 worker 中重建该 target */
  descriptor?: TargetDescriptor;
}

export interface TargetList {
  [type: string]: {
    [targetId: string | number]: Target;
  };
}

export interface TargetNode {
  readonly id: string | number;
  readonly name?: string;
  readonly [key: string | number]: any;
}

export type DepExtendedData = Record<string, any>;
