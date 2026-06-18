import { computed, reactive } from 'vue';

import { useServices } from '@editor/hooks/use-services';

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
