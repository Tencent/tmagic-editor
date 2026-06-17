import { computed, reactive } from 'vue';

import { datetimeFormatter } from '@tmagic/form';

import { useServices } from '@editor/hooks/use-services';
import type {
  BaseStepValue,
  HistoryOpSource,
  HistoryOpType,
  HistoryRowDescriptor,
  PageHistoryGroup,
  StepValue,
} from '@editor/type';

/**
 * 通用 bucket 分组（数据源 / 代码块及业务自定义历史）在面板中的展示结构。
 * 由 Bucket / BucketTab 复用，step 类型通过泛型 T 收窄（约束为 {@link BaseStepValue}）。
 */
export interface HistoryBucketGroup<T extends BaseStepValue = BaseStepValue> {
  /** 组内最后一步是否已应用 */
  applied: boolean;
  /** 是否为当前所在的分组 */
  isCurrent?: boolean;
  /** 该分组的操作类型 */
  opType: HistoryOpType;
  /** 组内所有步骤 */
  steps: { index: number; applied: boolean; isCurrent?: boolean; step: T }[];
}

/** GroupRow 渲染所需的单个子步视图模型（已由 {@link toRowGroup} 预先派生，组件内部不再触碰原始 step）。 */
export interface HistoryRowStep {
  /** 该子步在所属栈中的稳定索引。 */
  index: number;
  /** 是否已应用（false 表示已被 undo，UI 灰态）。 */
  applied: boolean;
  /** 是否为当前所在步骤。 */
  isCurrent?: boolean;
  /** 是否为最近一次保存的记录。 */
  saved?: boolean;
  /** 子步描述文案。 */
  desc: string;
  /** 是否可查看差异。 */
  diffable?: boolean;
  /** 是否可回滚。 */
  revertable?: boolean;
  /** 操作途径。 */
  source?: HistoryOpSource;
  /** 时间文案。 */
  time?: string;
  /** 时间的完整 title 提示。 */
  timeTitle?: string;
}

/**
 * GroupRow 渲染所需的整组视图模型（由 {@link toRowGroup} 统一派生）。
 * 把原先 GroupRow 上十多个扁平 props 收敛为单一对象，header 信息与子步列表一并携带。
 */
export interface HistoryRowGroup {
  /** 分组的稳定 key，作为 toggle 事件 payload 与折叠状态的索引。 */
  key: string;
  /** 组内最后一步是否已应用。 */
  applied: boolean;
  /** 是否为当前所在分组。 */
  isCurrent: boolean;
  /** 操作类型，用于徽标颜色与文案。 */
  opType: HistoryOpType;
  /** 组整体描述文案。 */
  desc: string;
  /** 组的操作途径（取组内最近一步）。 */
  source?: HistoryOpSource;
  /** 组头部时间文案（取组内最近一步）。 */
  time?: string;
  /** 组头部时间的完整 title 提示。 */
  timeTitle?: string;
  /** 子步列表（时间正序）；其长度即合并步数，length > 1 即为合并组。 */
  subSteps: HistoryRowStep[];
}

/** 合并组默认展开；仅当 expanded[key] === false 时为收起。 */
export const isHistoryGroupExpanded = (expanded: Record<string, boolean>, key: string) => expanded[key] !== false;

/**
 * 历史记录面板共享逻辑：
 * - 暴露三类历史的聚合数据（页面 / 数据源 / 代码块）；
 * - 提供折叠状态管理；
 * - 提供操作描述文案生成器。
 *
 * 所有数据基于 historyService 的 reactive state 派生，自动跟随历史变化刷新。
 */
export const useHistoryList = () => {
  const { historyService } = useServices();

  /**
   * 折叠状态：key 形如 `pg-${组内首步 index}` / `ds-${id}-${组内首步 index}` / `cb-${id}-${组内首步 index}`。
   * 用组内首步的稳定 index（而非展示位置）作为 key，确保历史数据更新后已展开的分组状态保持不变。
   * 合并组默认展开；仅当值为 `false` 时表示收起。
   */
  const expanded = reactive<Record<string, boolean>>({});
  const toggleGroup = (key: string) => {
    expanded[key] = expanded[key] === false;
  };

  const pageGroups = computed(() => historyService.getPageHistoryGroups());
  const dataSourceGroups = computed(() => historyService.getDataSourceHistoryGroups());
  const codeBlockGroups = computed(() => historyService.getCodeBlockHistoryGroups());

  /** 页面 tab 倒序展示（最新一组在最上面）。 */
  const pageGroupsDisplay = computed(() => pageGroups.value.slice().reverse());

  /**
   * 把按时间正序的 group 列表，再按 id 聚拢成 bucket（同 id 的所有分组放一起）。
   * 每个 bucket 内部仍然按时间倒序展示（最近的操作最先看到）。
   */
  const groupByTarget = <G extends { id: string | number }>(groups: G[]) => {
    const map = new Map<string | number, G[]>();
    groups.forEach((g) => {
      const list = map.get(g.id) ?? [];
      list.push(g);
      map.set(g.id, list);
    });
    return Array.from(map.entries()).map(([id, gs]) => ({ id, groups: gs.slice().reverse() }));
  };

  const dataSourceGroupsByTarget = computed(() => groupByTarget(dataSourceGroups.value));
  const codeBlockGroupsByTarget = computed(() => groupByTarget(codeBlockGroups.value));

  return {
    expanded,
    toggleGroup,
    pageGroups,
    dataSourceGroups,
    codeBlockGroups,
    pageGroupsDisplay,
    dataSourceGroupsByTarget,
    codeBlockGroupsByTarget,
  };
};

/**
 * 历史面板的时间展示：
 * - 当天的记录只显示 `HH:mm:ss`；
 * - 跨天的记录显示 `MM-DD HH:mm:ss`。
 * 无时间戳（旧数据 / 未写入）时返回空串，UI 据此不渲染时间。
 */
export const formatHistoryTime = (timestamp?: number): string => {
  if (!timestamp) return '';
  const isToday =
    datetimeFormatter(new Date(timestamp), '', 'YYYY-MM-DD') ===
    (datetimeFormatter(new Date(), '', 'YYYY-MM-DD') as string);
  return `${
    isToday
      ? datetimeFormatter(new Date(timestamp), '', 'HH:mm:ss')
      : datetimeFormatter(new Date(timestamp), '', 'MM-DD HH:mm:ss')
  }`;
};

/** 完整时间（含年份与秒），用于 title 悬浮提示。无时间戳时返回空串。 */
export const formatHistoryFullTime = (timestamp?: number): string =>
  timestamp ? `${datetimeFormatter(new Date(timestamp), '', 'YYYY-MM-DD HH:mm:ss')}` : '';

/** 取一组历史步骤里最后一步（最近一次）的时间戳，用于组头部展示。 */
export const groupTimestamp = (group: { steps: { step: { timestamp?: number } }[] }): number | undefined =>
  group.steps[group.steps.length - 1]?.step.timestamp;

export const opLabel = (op: HistoryOpType) => {
  switch (op) {
    case 'add':
      return '新增';
    case 'remove':
      return '删除';
    case 'update':
    default:
      return '修改';
  }
};

/** 内置操作途径的中文文案；自定义来源直接回显原值，未知 / 缺省返回空串（UI 据此不渲染）。 */
const HISTORY_SOURCE_LABELS: Record<string, string> = {
  stage: '画布',
  tree: '树面板',
  'component-panel': '组件面板',
  props: '配置面板',
  code: '源码',
  'root-code': 'DSL源码',
  'stage-contextmenu': '画布菜单',
  'tree-contextmenu': '树菜单',
  toolbar: '工具栏',
  shortcut: '快捷键',
  rollback: '回滚',
  api: '接口',
  ai: 'AI',
  initial: '初始值',
  sync: '同步',
  unknown: '未知',
};

/** 操作途径文案：用于历史面板展示「画布 / 树面板 / 配置面板…」标签。 */
export const sourceLabel = (source: HistoryOpSource = 'unknown'): string => {
  return HISTORY_SOURCE_LABELS[source] ?? `${source}`;
};

/** 取一组历史步骤里最后一步（最近一次）的操作途径，用于组头部展示。 */
export const groupSource = (group: { steps: { step: { source?: HistoryOpSource } }[] }): HistoryOpSource | undefined =>
  group.steps[group.steps.length - 1]?.step.source;

/** {@link toRowGroup} 接受的最小分组结构，PageHistoryGroup 与 HistoryBucketGroup 均满足。 */
interface RowGroupInput<T extends BaseStepValue = BaseStepValue> {
  applied: boolean;
  isCurrent?: boolean;
  opType: HistoryOpType;
  steps: { index: number; applied: boolean; isCurrent?: boolean; step: T }[];
}

/**
 * 把一个历史分组（页面 / bucket）派生为 GroupRow 直接消费的视图模型 {@link HistoryRowGroup}。
 * 统一了原先 PageTab / Bucket 各自内联的 sub-steps 映射逻辑：描述、可差异、可回滚、时间、途径
 * 全部在此一次性算好，组件层只负责渲染。
 */
export const toRowGroup = <T extends BaseStepValue = BaseStepValue>(
  group: RowGroupInput<T>,
  key: string,
  descriptor: HistoryRowDescriptor<T>,
): HistoryRowGroup => {
  const { describeGroup, describeStep, isStepDiffable, isStepRevertable } = descriptor;
  const timestamp = groupTimestamp(group);
  // 无 describeGroup 时回退到组内最后一步的 describeStep：数据源/代码块不做相邻合并，每组恒为单步，二者等价。
  const lastStep = group.steps[group.steps.length - 1]?.step;
  return {
    key,
    applied: group.applied,
    isCurrent: Boolean(group.isCurrent),
    opType: group.opType,
    desc: describeGroup ? describeGroup(group) : describeStep(lastStep),
    source: groupSource(group),
    time: formatHistoryTime(timestamp),
    timeTitle: formatHistoryFullTime(timestamp),
    subSteps: group.steps.map((s) => ({
      index: s.index,
      applied: s.applied,
      isCurrent: s.isCurrent,
      saved: s.step.saved,
      desc: describeStep(s.step),
      diffable: isStepDiffable ? isStepDiffable(s.step) : false,
      revertable: s.applied && (isStepRevertable ? isStepRevertable(s.step) : true),
      source: s.step.source,
      time: formatHistoryTime(s.step.timestamp),
      timeTitle: formatHistoryFullTime(s.step.timestamp),
    })),
  };
};

const nameOf = (node?: { name?: string; id?: string | number; type?: string }) =>
  node?.name || node?.type || `${node?.id ?? ''}`;

/**
 * 默认描述里展示「名称 (id: xxx)」，便于区分同名实体。
 * - 当未传入 id，或 label 本身就是 id 字符串（即没有 name/type/title 可用）时，仅展示 label，避免出现「123 (id: 123)」。
 */
const labelWithId = (label: string | number | undefined, id: string | number | undefined): string => {
  const labelStr = label === undefined || label === null ? '' : `${label}`;
  if (id === undefined || id === null || id === '') return labelStr;
  if (labelStr === '' || labelStr === `${id}`) return `${id}`;
  return `${labelStr} (id: ${id})`;
};

/** 从一组可选 historyDescription 中取最后一条非空值；都为空时返回 undefined。 */
const pickLastDescription = (descs: (string | undefined)[]): string | undefined => {
  for (let i = descs.length - 1; i >= 0; i--) {
    if (descs[i]) return descs[i];
  }
  return undefined;
};

/**
 * 页面 / 数据源 / 代码块三类历史共用的单步描述核心。
 * 各类型只在「取展示名」与「实体单位名」上有差异，通过参数注入，文案模板完全一致：
 * - 新增 / 删除：单实体展示「label」，多实体（仅页面可能出现）退化为「N 个X」；
 * - 修改：展示「label · propPath」，无 diff 时兜底「X」，多实体退化为「N 个X」。
 * 操作类型（新增 / 删除 / 修改）已由列表行的 op 徽标单独展示，故描述文案不再重复动词。
 * 展示 id 统一取 schema.id；调用方显式传入的 historyDescription 永远优先。
 */
export const describeStep = <T>(
  step: BaseStepValue<T>,
  getLabel: (_schema?: T) => string | number | undefined,
  unit: string,
): string => {
  if (step.historyDescription) return step.historyDescription;
  const items = step.diff ?? [];
  const label = (schema?: T) => labelWithId(getLabel(schema), (schema as { id?: string | number } | undefined)?.id);

  if (step.opType === 'add') {
    const node = items[0]?.newSchema;
    return items.length === 1 && node ? label(node) : `${items.length} 个${unit}`;
  }
  if (step.opType === 'remove') {
    const node = items[0]?.oldSchema;
    return items.length === 1 && node ? label(node) : `${items.length} 个${unit}`;
  }
  if (!items.length) return unit;
  if (items.length === 1) {
    const { newSchema, oldSchema, changeRecords } = items[0];
    const propPath = changeRecords?.map((changeRecord) => changeRecord.propPath).join(',');
    const target = label(newSchema ?? oldSchema);
    return propPath ? `${target} · ${propPath}` : target;
  }
  return `${items.length} 个${unit}`;
};

export const describePageStep = (step: StepValue): string => describeStep(step, (node) => nameOf(node), '节点');

/**
 * 合并组的展示文案：
 * - 若组内任一步显式提供了 historyDescription：取最后一条非空 historyDescription（最近一次的描述更准确）；
 * - 单步组：复用 describePageStep；
 * - 多步组（连续修改同一节点）：展示节点名 + 涉及的前几个 propPath。
 */
export const describePageGroup = (group: PageHistoryGroup) => {
  const lastDesc = pickLastDescription(group.steps.map((s) => s.step.historyDescription));
  if (lastDesc) return lastDesc;
  if (group.steps.length === 1) return describePageStep(group.steps[0].step);

  return labelWithId(group.targetName ?? (group.targetId !== undefined ? `${group.targetId}` : '节点'), group.targetId);
};

/**
 * 页面 step 是否支持「回滚」（类 git revert）：
 * - 新增 / 删除：不依赖 changeRecords，反向应用即删除 / 加回，始终可回滚；
 * - 更新：必须每个被更新节点都带有 changeRecords，才支持按 propPath 局部反向 patch。
 *   缺失 changeRecords 的更新只能整节点替换，会冲掉该节点后续的无关变更，因此不支持回滚。
 */
export const isPageStepRevertable = (step: StepValue): boolean => {
  if (step.opType !== 'update') return true;
  const items = step.diff ?? [];
  if (!items.length) return false;
  return items.every((item) => Boolean(item.changeRecords?.length));
};

/**
 * 单 diff 项历史（数据源 / 代码块）是否支持「回滚」：
 * - 新增（无 oldSchema）/ 删除（无 newSchema）：不依赖 changeRecords，始终可回滚；
 * - 更新（前后内容都存在）：必须有 changeRecords 才支持局部反向 patch，否则不支持回滚。
 */
export const isSingleDiffStepRevertable = (step: BaseStepValue): boolean => {
  const item = step.diff?.[0];
  if (!item?.oldSchema || !item?.newSchema) return true;
  return Boolean(item.changeRecords?.length);
};
