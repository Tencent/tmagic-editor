<template>
  <li
    class="m-editor-history-list-item m-editor-history-list-group"
    :class="{ 'is-undone': !applied, 'is-merged': merged, 'is-current': isCurrent }"
  >
    <div
      class="m-editor-history-list-group-head"
      :class="{ 'is-clickable': isHeadClickable }"
      :title="headTitle"
      @click="onHeadClick"
    >
      <span class="m-editor-history-list-item-op" :class="`op-${opType}`">{{ opLabel(opType) }}</span>
      <span class="m-editor-history-list-item-desc">{{ desc }}</span>
      <span v-if="isCurrent" class="m-editor-history-list-item-current">当前</span>
      <span
        v-if="!merged && headDiffable"
        class="m-editor-history-list-item-diff"
        title="查看修改差异"
        @click.stop="onDiffClick(subSteps[0].index)"
        >查看差异</span
      >
      <span v-if="merged" class="m-editor-history-list-item-merge">合并 {{ stepCount }} 步</span>
      <span v-if="merged" class="m-editor-history-list-group-toggle" :class="{ 'is-expanded': expanded }">▾</span>
    </div>

    <ul v-if="merged && expanded" class="m-editor-history-list-substeps">
      <li
        v-for="s in subSteps"
        :key="s.index"
        :class="{ 'is-undone': !s.applied, 'is-current': s.isCurrent, 'is-clickable': !s.isCurrent }"
        :title="s.isCurrent ? '当前所在记录' : '点击跳转到该记录'"
        @click="onSubStepClick(s)"
      >
        <span class="m-editor-history-list-item-index">#{{ s.index + 1 }}</span>
        <span class="m-editor-history-list-substep-desc">{{ s.desc }}</span>
        <span v-if="s.isCurrent" class="m-editor-history-list-item-current">当前</span>
        <span
          v-if="s.diffable"
          class="m-editor-history-list-item-diff"
          title="查看修改差异"
          @click.stop="onDiffClick(s.index)"
          >查看差异</span
        >
      </li>
    </ul>
  </li>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import type { HistoryOpType } from '@editor/type';

import { opLabel } from './composables';

defineOptions({
  name: 'MEditorHistoryListGroupRow',
});

const props = defineProps<{
  /** 唯一标识当前组的 key，作为 toggle 事件的 payload 回传给上层。形如 `pg-${idx}` / `ds-${id}-${idx}` / `cb-${id}-${idx}`。 */
  groupKey: string;
  /** 该组当前是否处于已应用状态（false 表示已被 undo 撤销，UI 会显示为灰态）。 */
  applied: boolean;
  /** 是否为合并组（即组内 step 数大于 1，由多次连续操作合并而来）。决定是否展示合并标记与可展开的子步列表。 */
  merged: boolean;
  /** 操作类型：`add` / `remove` / `update`，用于决定操作徽标的颜色和文案。 */
  opType: HistoryOpType;
  /** 组的整体描述文案，由上层根据 step / group 计算后传入，例如 "修改 button · style.color"。 */
  desc: string;
  /** 组内的 step 总数，仅在 merged 为 true 时显示为 "合并 N 步"。 */
  stepCount: number;
  /** 子步列表，用于在展开状态下逐条展示每个 step 的索引、应用状态与描述文案。 */
  subSteps: { index: number; applied: boolean; desc: string; isCurrent?: boolean; diffable?: boolean }[];
  /** 当前组是否处于展开状态。仅在 merged 为 true 时生效，控制子步列表是否渲染。 */
  expanded: boolean;
  /** 是否为当前所在的分组（包含栈中最近一次已应用步骤的那一组），UI 高亮展示。 */
  isCurrent?: boolean;
}>();

const emit = defineEmits<{
  /**
   * 用户点击合并组头部时触发，携带 groupKey；上层用其切换 expanded 状态。
   * 对单步组（非合并）头部点击不会发该事件——因为单步组没有"展开"的概念。
   */
  (_e: 'toggle', _key: string): void;
  /**
   * 用户希望跳转到该记录时触发，携带"目标 step 在所属栈中的索引"——上层据此计算目标 cursor (= index + 1)。
   * 触发场景：
   * - 单步组（merged=false）头部：取该唯一 step 的 index；
   * - 子步条目：取该子步的 index。
   * 合并组头部不再触发 goto，避免与展开/收起冲突；用户应展开后点具体子步精准跳转。
   * 当前所在的步骤（isCurrent）始终不会触发 goto。
   */
  (_e: 'goto', _index: number): void;
  /**
   * 用户希望查看该 step 的修改差异（旧值 vs 新值）。
   * 只在 step 满足"前后值都存在"（如 update / 数据源、代码块的 update）时由父级标记 `diffable=true`。
   * payload 为该 step 在所属栈中的索引，由上层根据 index 取 step 内容并展示对比。
   */
  (_e: 'diff-step', _index: number): void;
}>();

/** 单步组：头部可点击 goto；合并组：头部可点击切换展开。当前组（isCurrent）的单步组头部不可点击。 */
const isHeadClickable = computed(() => {
  if (props.merged) return true;
  return !props.isCurrent;
});

const headTitle = computed(() => {
  if (props.merged) return props.expanded ? '点击收起子步' : '点击展开子步';
  if (props.isCurrent) return '当前所在记录';
  return '点击跳转到该记录';
});

/**
 * 头部点击行为分流：
 * - 合并组：仅切换展开 / 收起，不触发 goto；
 * - 单步组：跳转到该唯一步骤；当前组忽略点击。
 */
const onHeadClick = () => {
  if (props.merged) {
    emit('toggle', props.groupKey);
    return;
  }
  if (props.isCurrent) return;
  if (!props.subSteps.length) return;
  emit('goto', props.subSteps[0].index);
};

const onSubStepClick = (s: { index: number; isCurrent?: boolean }) => {
  if (s.isCurrent) return;
  emit('goto', s.index);
};

/** 单步组头部是否展示"查看差异"入口：要求该唯一子步本身可对比。 */
const headDiffable = computed(() => !props.merged && Boolean(props.subSteps[0]?.diffable));

const onDiffClick = (index: number) => {
  emit('diff-step', index);
};
</script>
