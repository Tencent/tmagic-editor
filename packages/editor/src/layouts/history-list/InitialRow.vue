<template>
  <li
    class="m-editor-history-list-item m-editor-history-list-initial"
    :class="{ 'is-current': isCurrent, 'is-clickable': !isCurrent }"
    :title="isCurrent ? '当前已回到未修改的初始状态' : '点击回到未修改的初始状态'"
    @click="onClick"
  >
    <span class="m-editor-history-list-item-op op-initial">初始</span>
    <span class="m-editor-history-list-item-desc">未修改的初始状态</span>
    <span v-if="isCurrent" class="m-editor-history-list-item-current">当前</span>
  </li>
</template>

<script lang="ts" setup>
/**
 * 「初始状态」记录行：渲染于历史列表底部，作为整个栈的"零点"。
 * - 点击该行会把对应栈撤销到 cursor === 0（即没有任何已应用步骤），等同于回到所有修改之前。
 * - 当对应栈本身已处于 cursor === 0 时（isCurrent=true），用户已在初始状态，点击不再触发动作。
 *
 * 该行不是真实 step，仅作为 UI 入口；上层负责把"点击"翻译为 `service.goto*(0)`。
 */
defineOptions({
  name: 'MEditorHistoryListInitialRow',
});

const props = defineProps<{
  /** 当前对应栈是否已经处于初始状态 (cursor === 0)。true 时用蓝条高亮并禁用点击。 */
  isCurrent: boolean;
}>();

const emit = defineEmits<{
  /** 点击非当前的初始项时触发，由上层调用对应 service 的 goto 把 cursor 移到 0。 */
  (_e: 'goto-initial'): void;
}>();

const onClick = () => {
  if (props.isCurrent) return;
  emit('goto-initial');
};
</script>
