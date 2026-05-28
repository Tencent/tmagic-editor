<template>
  <li
    class="m-editor-history-list-item m-editor-history-list-group"
    :class="{ 'is-undone': !applied, 'is-merged': merged, 'is-current': isCurrent }"
  >
    <div class="m-editor-history-list-group-head" @click="$emit('toggle', groupKey)">
      <span class="m-editor-history-list-item-op" :class="`op-${opType}`">{{ opLabel(opType) }}</span>
      <span class="m-editor-history-list-item-desc">{{ desc }}</span>
      <span v-if="isCurrent" class="m-editor-history-list-item-current">当前</span>
      <span v-if="merged" class="m-editor-history-list-item-merge">合并 {{ stepCount }} 步</span>
    </div>

    <ul v-if="merged && expanded" class="m-editor-history-list-substeps">
      <li v-for="s in subSteps" :key="s.index" :class="{ 'is-undone': !s.applied, 'is-current': s.isCurrent }">
        <span class="m-editor-history-list-item-index">#{{ s.index + 1 }}</span>
        <span>{{ s.desc }}</span>
        <span v-if="s.isCurrent" class="m-editor-history-list-item-current">当前</span>
      </li>
    </ul>
  </li>
</template>

<script lang="ts" setup>
import type { HistoryOpType } from '@editor/type';

import { opLabel } from './composables';

defineOptions({
  name: 'MEditorHistoryListGroupRow',
});

defineProps<{
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
  subSteps: { index: number; applied: boolean; desc: string; isCurrent?: boolean }[];
  /** 当前组是否处于展开状态。仅在 merged 为 true 时生效，控制子步列表是否渲染。 */
  expanded: boolean;
  /** 是否为当前所在的分组（包含栈中最近一次已应用步骤的那一组），UI 高亮展示。 */
  isCurrent?: boolean;
}>();

defineEmits<{
  /** 用户点击组头部时触发，携带 groupKey，由上层维护折叠状态。 */
  (_e: 'toggle', _key: string): void;
}>();
</script>
