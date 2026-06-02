import { computed, reactive } from 'vue';

import { useServices } from '@editor/hooks/use-services';
import type {
  CodeBlockHistoryGroup,
  CodeBlockStepValue,
  DataSourceHistoryGroup,
  DataSourceStepValue,
  HistoryOpType,
  PageHistoryGroup,
  StepValue,
} from '@editor/type';

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

const nameOf = (node: { name?: string; id?: string | number; type?: string }) =>
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
  if (opType === 'add') {
    const count = step.nodes?.length ?? 0;
    const node = step.nodes?.[0];
    return `新增 ${count} 个节点${count === 1 && node ? `（${labelWithId(nameOf(node), node.id)}）` : ''}`;
  }
  if (opType === 'remove') {
    const count = step.removedItems?.length ?? 0;
    const node = step.removedItems?.[0]?.node;
    return `删除 ${count} 个节点${count === 1 && node ? `（${labelWithId(nameOf(node), node.id)}）` : ''}`;
  }
  const updated = step.updatedItems ?? [];
  if (!updated.length) return '修改节点';
  if (updated.length === 1) {
    const { newNode, changeRecords } = updated[0];
    const propPath = changeRecords?.[0]?.propPath;
    const target = labelWithId(nameOf(newNode), newNode?.id);
    return `修改 ${target}${propPath ? ` · ${propPath}` : ''}`;
  }
  return `修改 ${updated.length} 个节点`;
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
    s.step.updatedItems?.[0]?.changeRecords?.forEach((r) => r.propPath && paths.add(r.propPath));
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
  if (step.oldSchema === null && step.newSchema)
    return `创建 ${labelWithId(step.newSchema.title, step.newSchema.id ?? step.id)}`;
  if (step.newSchema === null && step.oldSchema)
    return `删除 ${labelWithId(step.oldSchema.title, step.oldSchema.id ?? step.id)}`;
  const propPath = step.changeRecords?.[0]?.propPath;
  const title = labelWithId(step.newSchema?.title || step.oldSchema?.title, step.id);
  return propPath ? `修改 ${title} · ${propPath}` : `修改 ${title}`;
};

export const describeDataSourceGroup = (group: DataSourceHistoryGroup) => {
  const lastDesc = pickLastDescription(group.steps.map((s) => s.step.historyDescription));
  if (lastDesc) return lastDesc;
  if (group.steps.length === 1) return describeDataSourceStep(group.steps[0].step);
  const paths = new Set<string>();
  group.steps.forEach((s) => {
    s.step.changeRecords?.forEach((r) => r.propPath && paths.add(r.propPath));
  });
  const pathList = Array.from(paths).slice(0, 3).join(', ');
  const rawTitle = group.steps[group.steps.length - 1].step.newSchema?.title || group.steps[0].step.oldSchema?.title;
  const target = labelWithId(rawTitle, group.id);
  return pathList ? `修改 ${target} · ${pathList}${paths.size > 3 ? '…' : ''}` : `修改 ${target}`;
};

export const describeCodeBlockStep = (step: CodeBlockStepValue) => {
  if (step.historyDescription) return step.historyDescription;
  if (step.oldContent === null && step.newContent)
    return `创建 ${labelWithId(step.newContent.name, step.newContent.id ?? step.id)}`;
  if (step.newContent === null && step.oldContent)
    return `删除 ${labelWithId(step.oldContent.name, step.oldContent.id ?? step.id)}`;
  const propPath = step.changeRecords?.[0]?.propPath;
  const title = labelWithId(step.newContent?.name || step.oldContent?.name, step.id);
  return propPath ? `修改 ${title} · ${propPath}` : `修改 ${title}`;
};

export const describeCodeBlockGroup = (group: CodeBlockHistoryGroup) => {
  const lastDesc = pickLastDescription(group.steps.map((s) => s.step.historyDescription));
  if (lastDesc) return lastDesc;
  if (group.steps.length === 1) return describeCodeBlockStep(group.steps[0].step);
  const paths = new Set<string>();
  group.steps.forEach((s) => {
    s.step.changeRecords?.forEach((r) => r.propPath && paths.add(r.propPath));
  });
  const pathList = Array.from(paths).slice(0, 3).join(', ');
  const rawName = group.steps[group.steps.length - 1].step.newContent?.name || group.steps[0].step.oldContent?.name;
  const target = labelWithId(rawName, group.id);
  return pathList ? `修改 ${target} · ${pathList}${paths.size > 3 ? '…' : ''}` : `修改 ${target}`;
};
