import type { DepData } from '@tmagic/schema';

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

export type IsTarget = (key: string | number, value: any) => boolean;

export interface TargetOptions {
  isTarget: IsTarget;
  id: string | number;
  /** 类型，数据源、代码块或其他 */
  type?: string;
  name?: string;
  initialDeps?: DepData;
  /** 是否默认收集，默认为true，当值为false时需要传入type参数给collect方法才会被收集 */
  isCollectByDefault?: boolean;
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
