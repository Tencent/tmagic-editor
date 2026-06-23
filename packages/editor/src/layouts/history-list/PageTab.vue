<template>
  <div v-if="!list.length && !marker" class="m-editor-history-list-empty">暂无操作记录</div>
  <template v-else>
    <div v-if="list.length" class="m-editor-history-list-toolbar">
      <span class="m-editor-history-list-clear" title="清空当前页面的历史记录" @click="$emit('clear')">清空</span>
    </div>
    <TMagicScrollbar max-height="360px">
      <ul class="m-editor-history-list-ul">
        <GroupRow
          v-for="group in list"
          :key="rowKey(group)"
          :group="toRow(group)"
          :expanded="isHistoryGroupExpanded(expanded, rowKey(group))"
          :select-enabled="true"
          @toggle="(key: string) => $emit('toggle', key)"
          @goto="(index: number) => $emit('goto', index)"
          @diff-step="(index: number) => $emit('diff-step', index)"
          @revert-step="(index: number) => $emit('revert-step', index)"
          @select="(index: number) => $emit('select', index)"
        />
        <!--
        初始状态项：永远位于列表底部（页面 tab 倒序展示，最底部=最早），
        作为"未修改"零点。当所有 group 都未 applied 时它即为当前位置。
        设置 root 时生成的「未修改的初始状态」标记（marker）会作为该行的文案与时间来源。
      -->
        <InitialRow :is-current="isInitial" :marker="marker" @goto-initial="$emit('goto-initial')" />
      </ul>
    </TMagicScrollbar>
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { TMagicScrollbar } from '@tmagic/design';

import type { HistoryGroup, HistoryRowDescriptor, StepValue } from '@editor/type';

import type { HistoryRowGroup } from './composables';
import {
  describePageGroup,
  describePageStep,
  isHistoryGroupExpanded,
  isPageStepRevertable,
  toRowGroup,
} from './composables';
import GroupRow from './GroupRow.vue';
import InitialRow from './InitialRow.vue';

defineOptions({
  name: 'MEditorHistoryListPageTab',
});

const props = defineProps<{
  /** 当前活动页面的历史分组列表，已按时间倒序排好（最新一组在最前）。空数组时显示空态。 */
  list: HistoryGroup<StepValue>[];
  /**
   * 共享的折叠状态表（key -> 是否展开，缺省或 true 为展开、false 为收起），由顶层 panel 统一维护。
   * 本 tab 使用 `pg-${组内首步 index}` 作为 key——以稳定的 step 索引而非展示位置标识分组，
   * 这样历史数据更新（新增 / 撤销重做导致列表顺序变化）后，已展开的分组状态仍能正确保持。
   */
  expanded: Record<string, boolean>;
  /**
   * 当前活动页的「加载/初始」基线记录（设置 root 时生成的 `opType: 'initial'` StepValue）。
   * 提供时即使没有任何操作记录也会展示底部初始行，并用其文案 / 时间渲染。
   */
  marker?: StepValue;
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
  /** 用户点击记录行希望选中对应节点，携带目标 step 在栈中的索引。 */
  (_e: 'select', _index: number): void;
  /** 用户点击"清空"按钮，请求清空当前页面的历史记录（由上层弹窗二次确认后执行）。 */
  (_e: 'clear'): void;
}>();

/**
 * 当前 step 是否可查看差异：
 * - 仅 update 操作；
 * - 单节点更新（diff.length === 1），且 oldSchema / newSchema 都存在。
 * 多节点更新难以选定单一对比目标，统一不展示差异入口。
 */
const isPageStepDiffable = (step: StepValue): boolean => {
  if (step.opType !== 'update') return false;
  const items = step.diff ?? [];
  if (items.length !== 1) return false;
  return Boolean(items[0]?.oldSchema && items[0]?.newSchema);
};

/** 页面历史的描述 / 可操作性判定集合，注入给统一的 `toRowGroup`。 */
const descriptor: HistoryRowDescriptor<StepValue> = {
  describeGroup: describePageGroup,
  describeStep: describePageStep,
  isStepDiffable: isPageStepDiffable,
  isStepRevertable: isPageStepRevertable,
};

const rowKey = (group: HistoryGroup<StepValue>) => `pg-${group.steps[0]?.index}`;

const toRow = (group: HistoryGroup<StepValue>): HistoryRowGroup => toRowGroup(group, rowKey(group), descriptor);

/**
 * 是否处于"初始状态"——即对应页面历史栈 cursor===0：
 * 当 list 中所有 group 的 applied 都为 false 时即为该状态（空列表 `every` 返回 true，
 * 即仅有 marker、无任何操作记录时也视为处于初始状态）。
 */
const isInitial = computed(() => props.list.every((g) => !g.applied));
</script>
