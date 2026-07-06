<template>
  <TMagicPopconfirm
    placement="top"
    :width="action.popconfirmWidth"
    :title="formatter(action.confirmText, row) || '确定执行此操作？'"
    @confirm="onConfirm"
  >
    <template #reference>
      <ActionButton :action="action" :row="row" :index="index" :btn-class="btnClass" :visible="visible" />
    </template>
  </TMagicPopconfirm>
</template>

<script lang="ts" setup>
import { TMagicPopconfirm } from '@tmagic/design';

import ActionButton from './ActionButton.vue';
import { formatActionText as formatter } from './actionHelpers';
import { ColumnActionConfig } from './schema';

defineOptions({
  name: 'MTableActionPopconfirm',
});

const props = withDefaults(
  defineProps<{
    action: ColumnActionConfig;
    row: any;
    index: number;
    btnClass?: string;
    visible?: boolean;
  }>(),
  {
    btnClass: 'action-btn',
    visible: true,
  },
);

const emit = defineEmits<{
  confirm: [action: ColumnActionConfig, row: any, index: number];
}>();

const onConfirm = () => emit('confirm', props.action, props.row, props.index);
</script>
