<template>
  <li
    class="m-editor-history-list-item m-editor-history-list-initial"
    :class="{ 'is-current': isCurrent, 'is-clickable': !isCurrent }"
    :title="rowTitle"
  >
    <span class="m-editor-history-list-item-index" title="历史步骤编号 #0（未修改的初始状态）">#0</span>
    <span class="m-editor-history-list-item-op op-initial">初始</span>
    <span class="m-editor-history-list-item-desc">{{ desc }}</span>
    <span v-if="gotoEnabled && !isCurrent" class="m-editor-history-list-item-actions">
      <span class="m-editor-history-list-item-goto" title="回到该记录" @click.stop="onClick">回到</span>
    </span>
    <span v-if="time" class="m-editor-history-list-item-time" :title="timeTitle">{{ time }}</span>
  </li>
</template>

<script lang="ts" setup>
/**
 * 「初始状态」记录行：渲染于历史列表底部，作为整个栈的"零点"。
 * - 点击该行会把对应栈撤销到 cursor === 0（即没有任何已应用步骤），等同于回到所有修改之前。
 * - 当对应栈本身已处于 cursor === 0 时（isCurrent=true），用户已在初始状态，点击不再触发动作。
 * - 当上层传入 `marker`（设置 root 时为该页生成的「未修改的初始状态」标记）时，
 *   用标记的文案与时间渲染本行；标记不进入撤销/重做栈，仅作为该页基线展示。
 *
 * 该行不是真实 step，仅作为 UI 入口；上层负责把"点击"翻译为 `service.goto*(0)`。
 */
import { computed } from 'vue';

import type { StepValue } from '@editor/type';

import { formatHistoryFullTime, formatHistoryTime } from './composables';

defineOptions({
  name: 'MEditorHistoryListInitialRow',
});

const props = withDefaults(
  defineProps<{
    /** 当前对应栈是否已经处于初始状态 (cursor === 0)。true 时用蓝条高亮并禁用点击。 */
    isCurrent: boolean;
    gotoEnabled?: boolean;
    /** 该页面的「加载/初始」基线记录（设置 root 时生成的 `opType: 'initial'` StepValue）；提供时用其文案与时间展示。 */
    marker?: StepValue;
  }>(),
  {
    gotoEnabled: true,
    marker: undefined,
  },
);

const desc = computed(() => props.marker?.historyDescription || '未修改的初始状态');
const time = computed(() => formatHistoryTime(props.marker?.timestamp));
const timeTitle = computed(() => formatHistoryFullTime(props.marker?.timestamp));
const rowTitle = computed(() => {
  const base = props.marker?.historyDescription || '未修改的初始状态';
  return props.isCurrent ? `当前已回到${base}` : `点击回到${base}`;
});

const emit = defineEmits<{
  /** 点击非当前的初始项时触发，由上层调用对应 service 的 goto 把 cursor 移到 0。 */
  (_e: 'goto-initial'): void;
}>();

const onClick = () => {
  if (props.isCurrent) return;
  emit('goto-initial');
};
</script>
