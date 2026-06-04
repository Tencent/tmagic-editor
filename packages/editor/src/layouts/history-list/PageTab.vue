<template>
  <div v-if="!list.length" class="m-editor-history-list-empty">暂无操作记录</div>
  <TMagicScrollbar v-else max-height="360px">
    <ul class="m-editor-history-list-ul">
      <GroupRow
        v-for="group in list"
        :key="`pg-${group.steps[0]?.index}`"
        :group-key="`pg-${group.steps[0]?.index}`"
        :applied="group.applied"
        :merged="group.steps.length > 1"
        :op-type="group.opType"
        :desc="describePageGroup(group)"
        :source="groupSource(group)"
        :time="formatHistoryTime(groupTimestamp(group))"
        :time-title="formatHistoryFullTime(groupTimestamp(group))"
        :step-count="group.steps.length"
        :sub-steps="
          group.steps.map((s) => ({
            index: s.index,
            applied: s.applied,
            isCurrent: s.isCurrent,
            desc: describePageStep(s.step),
            diffable: isPageStepDiffable(s.step),
            revertable: s.applied,
            source: s.step.source,
            time: formatHistoryTime(s.step.timestamp),
            timeTitle: formatHistoryFullTime(s.step.timestamp),
          }))
        "
        :is-current="group.isCurrent"
        :expanded="!!expanded[`pg-${group.steps[0]?.index}`]"
        @toggle="(key: string) => $emit('toggle', key)"
        @goto="(index: number) => $emit('goto', index)"
        @diff-step="(index: number) => $emit('diff-step', index)"
        @revert-step="(index: number) => $emit('revert-step', index)"
      />
      <!--
        初始状态项：永远位于列表底部（页面 tab 倒序展示，最底部=最早），
        作为"未修改"零点。当所有 group 都未 applied 时它即为当前位置。
      -->
      <InitialRow :is-current="isInitial" @goto-initial="$emit('goto-initial')" />
    </ul>
  </TMagicScrollbar>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { TMagicScrollbar } from '@tmagic/design';

import type { PageHistoryGroup, StepValue } from '@editor/type';

import {
  describePageGroup,
  describePageStep,
  formatHistoryFullTime,
  formatHistoryTime,
  groupSource,
  groupTimestamp,
} from './composables';
import GroupRow from './GroupRow.vue';
import InitialRow from './InitialRow.vue';

defineOptions({
  name: 'MEditorHistoryListPageTab',
});

const props = defineProps<{
  /** 当前活动页面的历史分组列表，已按时间倒序排好（最新一组在最前）。空数组时显示空态。 */
  list: PageHistoryGroup[];
  /**
   * 共享的折叠状态表（key -> 是否展开），由顶层 panel 统一维护。
   * 本 tab 使用 `pg-${组内首步 index}` 作为 key——以稳定的 step 索引而非展示位置标识分组，
   * 这样历史数据更新（新增 / 撤销重做导致列表顺序变化）后，已展开的分组状态仍能正确保持。
   */
  expanded: Record<string, boolean>;
}>();

defineEmits<{
  /** 透传 GroupRow 的 toggle 事件给上层 panel，由其更新 expanded。 */
  (_e: 'toggle', _key: string): void;
  /** 透传 GroupRow 的 goto 事件，携带目标 step 在栈中的索引。 */
  (_e: 'goto', _index: number): void;
  /** 用户点击初始项希望回到未修改的状态（cursor=0）。 */
  (_e: 'goto-initial'): void;
  /** 用户点击"查看差异"按钮，携带目标 step 在栈中的索引。 */
  (_e: 'diff-step', _index: number): void;
  /** 用户点击"回滚"按钮，携带目标 step 在栈中的索引，类 git revert。 */
  (_e: 'revert-step', _index: number): void;
}>();

/**
 * 当前 step 是否可查看差异：
 * - 仅 update 操作；
 * - 单节点更新（updatedItems.length === 1），且 oldNode / newNode 都存在。
 * 多节点更新难以选定单一对比目标，统一不展示差异入口。
 */
const isPageStepDiffable = (step: StepValue): boolean => {
  if (step.opType !== 'update') return false;
  const items = step.updatedItems ?? [];
  if (items.length !== 1) return false;
  return Boolean(items[0]?.oldNode && items[0]?.newNode);
};

/**
 * 是否处于"初始状态"——即对应页面历史栈 cursor===0：
 * 当 list 中所有 group 的 applied 都为 false 时即为该状态。
 * 没有任何 group 的情况由外层"暂无操作记录"分支兜底，本计算可以不考虑。
 */
const isInitial = computed(() => props.list.length > 0 && props.list.every((g) => !g.applied));
</script>
