import { computed, reactive } from 'vue';

import { datetimeFormatter } from '@tmagic/form';

import { useServices } from '@editor/hooks/use-services';
import type {
  BaseStepValue,
  CodeBlockHistoryGroup,
  CodeBlockStepValue,
  DataSourceHistoryGroup,
  DataSourceStepValue,
  HistoryOpSource,
  HistoryOpType,
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

/**
 * 一组「描述 + 可操作性」的判定函数集合。页面 / 数据源 / 代码块及业务自定义历史
 * 各自实现一份，作为整体注入，避免把 describe* / isStep* 拆成多个独立 props 反复透传。
 */
export interface HistoryRowDescriptor<T extends BaseStepValue = BaseStepValue> {
  /** 组级描述文案生成器，接收一个 group，返回展示文本。 */
  describeGroup: (_group: any) => string;
  /** 单步描述文案生成器，接收一个 step，返回展示文本（合并组展开后的子步列表用）。 */
  describeStep: (_step: T) => string;
  /** 判断某个 step 是否可查看差异（前后值都存在）。不传则一律不展示差异入口。 */
  isStepDiffable?: (_step: T) => boolean;
  /** 判断某个 step 是否支持回滚（如更新需带 changeRecords）。不传则已应用即可回滚。 */
  isStepRevertable?: (_step: T) => boolean;
}

/**
 * 通用 bucket（数据源 / 代码块 / 业务自定义历史）的整体渲染配置。
 * 把原先散落在 Bucket / BucketTab 上的 title / prefix / describe* / isStep* / showInitial / gotoEnabled
 * 收敛成一个对象作为单一 prop 传递，调用方一次配齐、组件内部按需读取。
 */
export interface HistoryBucketConfig<T extends BaseStepValue = BaseStepValue> extends HistoryRowDescriptor<T> {
  /** bucket 头部标题，例如 "数据源" / "代码块"。 */
  title: string;
  /** 子项 key 的命名空间前缀（`ds` 数据源 / `cb` 代码块 / 业务自定义如 `mod`）。 */
  prefix: string;
  /** 是否展示底部「回到初始状态」入口，默认 true。无 undo cursor 语义的自定义历史可传 false。 */
  showInitial?: boolean;
  /** 是否支持「跳转到该记录」(goto)，默认 true。 */
  gotoEnabled?: boolean;
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
   */
  const expanded = reactive<Record<string, boolean>>({});
  const toggleGroup = (key: string) => {
    expanded[key] = !expanded[key];
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
  'stage-contextmenu': '画布菜单',
  'tree-contextmenu': '树菜单',
  toolbar: '工具栏',
  shortcut: '快捷键',
  rollback: '回滚',
  api: '接口',
  ai: 'AI',
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
  return {
    key,
    applied: group.applied,
    isCurrent: Boolean(group.isCurrent),
    opType: group.opType,
    desc: describeGroup(group),
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

export const describePageStep = (step: StepValue) => {
  if (step.historyDescription) return step.historyDescription;
  const { opType } = step;
  const items = step.diff ?? [];
  if (opType === 'add') {
    const count = items.length;
    const node = items[0]?.newSchema;
    return `新增 ${count} 个节点${count === 1 && node ? `（${labelWithId(nameOf(node), node.id)}）` : ''}`;
  }
  if (opType === 'remove') {
    const count = items.length;
    const node = items[0]?.oldSchema;
    return `删除 ${count} 个节点${count === 1 && node ? `（${labelWithId(nameOf(node), node.id)}）` : ''}`;
  }
  if (!items.length) return '修改节点';
  if (items.length === 1) {
    const { newSchema, changeRecords } = items[0];
    const propPath = changeRecords?.[0]?.propPath;
    const target = labelWithId(nameOf(newSchema), newSchema?.id);
    return `修改 ${target}${propPath ? ` · ${propPath}` : ''}`;
  }
  return `修改 ${items.length} 个节点`;
};

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
  const paths = new Set<string>();
  group.steps.forEach((s) => {
    s.step.diff?.[0]?.changeRecords?.forEach((r) => r.propPath && paths.add(r.propPath));
  });
  const pathList = Array.from(paths).slice(0, 3).join(', ');
  const target = labelWithId(
    group.targetName ?? (group.targetId !== undefined ? `${group.targetId}` : '节点'),
    group.targetId,
  );
  return pathList ? `修改 ${target} · ${pathList}${paths.size > 3 ? '…' : ''}` : `修改 ${target}`;
};

export const describeDataSourceStep = (step: DataSourceStepValue) => {
  if (step.historyDescription) return step.historyDescription;
  const { oldSchema: oldSchema, newSchema: newSchema, changeRecords } = step.diff?.[0] ?? {};
  if (!oldSchema && newSchema) return `创建 ${labelWithId(newSchema.title, newSchema.id ?? step.id)}`;
  if (!newSchema && oldSchema) return `删除 ${labelWithId(oldSchema.title, oldSchema.id ?? step.id)}`;
  const propPath = changeRecords?.[0]?.propPath;
  const title = labelWithId(newSchema?.title || oldSchema?.title, step.id);
  return propPath ? `修改 ${title} · ${propPath}` : `修改 ${title}`;
};

export const describeDataSourceGroup = (group: DataSourceHistoryGroup) => {
  const lastDesc = pickLastDescription(group.steps.map((s) => s.step.historyDescription));
  if (lastDesc) return lastDesc;
  if (group.steps.length === 1) return describeDataSourceStep(group.steps[0].step);
  const paths = new Set<string>();
  group.steps.forEach((s) => {
    s.step.diff?.[0]?.changeRecords?.forEach((r) => r.propPath && paths.add(r.propPath));
  });
  const pathList = Array.from(paths).slice(0, 3).join(', ');
  const rawTitle =
    group.steps[group.steps.length - 1].step.diff?.[0]?.newSchema?.title ||
    group.steps[0].step.diff?.[0]?.oldSchema?.title;
  const target = labelWithId(rawTitle, group.id);
  return pathList ? `修改 ${target} · ${pathList}${paths.size > 3 ? '…' : ''}` : `修改 ${target}`;
};

export const describeCodeBlockStep = (step: CodeBlockStepValue) => {
  if (step.historyDescription) return step.historyDescription;
  const { oldSchema: oldContent, newSchema: newContent, changeRecords } = step.diff?.[0] ?? {};
  if (!oldContent && newContent) return `创建 ${labelWithId(newContent.name, newContent.id ?? step.id)}`;
  if (!newContent && oldContent) return `删除 ${labelWithId(oldContent.name, oldContent.id ?? step.id)}`;
  const propPath = changeRecords?.[0]?.propPath;
  const title = labelWithId(newContent?.name || oldContent?.name, step.id);
  return propPath ? `修改 ${title} · ${propPath}` : `修改 ${title}`;
};

export const describeCodeBlockGroup = (group: CodeBlockHistoryGroup) => {
  const lastDesc = pickLastDescription(group.steps.map((s) => s.step.historyDescription));
  if (lastDesc) return lastDesc;
  if (group.steps.length === 1) return describeCodeBlockStep(group.steps[0].step);
  const paths = new Set<string>();
  group.steps.forEach((s) => {
    s.step.diff?.[0]?.changeRecords?.forEach((r) => r.propPath && paths.add(r.propPath));
  });
  const pathList = Array.from(paths).slice(0, 3).join(', ');
  const rawName =
    group.steps[group.steps.length - 1].step.diff?.[0]?.newSchema?.name ||
    group.steps[0].step.diff?.[0]?.oldSchema?.name;
  const target = labelWithId(rawName, group.id);
  return pathList ? `修改 ${target} · ${pathList}${paths.size > 3 ? '…' : ''}` : `修改 ${target}`;
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
 * 数据源 step 是否支持「回滚」：
 * - 新增（无 oldSchema）/ 删除（无 newSchema）：不依赖 changeRecords，始终可回滚；
 * - 更新（前后 schema 都存在）：必须有 changeRecords 才支持局部反向 patch，否则不支持回滚。
 */
export const isDataSourceStepRevertable = (step: DataSourceStepValue): boolean => {
  const item = step.diff?.[0];
  if (!item?.oldSchema || !item?.newSchema) return true;
  return Boolean(item.changeRecords?.length);
};

/**
 * 代码块 step 是否支持「回滚」：
 * - 新增（无 oldSchema）/ 删除（无 newSchema）：不依赖 changeRecords，始终可回滚；
 * - 更新（前后 content 都存在）：必须有 changeRecords 才支持局部反向 patch，否则不支持回滚。
 */
export const isCodeBlockStepRevertable = (step: CodeBlockStepValue): boolean => {
  const item = step.diff?.[0];
  if (!item?.oldSchema || !item?.newSchema) return true;
  return Boolean(item.changeRecords?.length);
};
