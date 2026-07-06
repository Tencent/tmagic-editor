<template>
  <TMagicButton
    v-show="visible"
    :class="btnClass"
    link
    size="small"
    :type="action.buttonType || 'primary'"
    :icon="action.icon"
    :disabled="disabled(action.disabled, row)"
    @click="onClick"
  >
    <span v-html="formatter(action.text, row)"></span>
  </TMagicButton>
</template>

<script lang="ts" setup>
import { TMagicButton } from '@tmagic/design';

import { disabled, formatActionText as formatter } from './actionHelpers';
import { ColumnActionConfig } from './schema';

defineOptions({
  name: 'MTableActionButton',
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
  click: [action: ColumnActionConfig, row: any, index: number];
}>();

const onClick = () => emit('click', props.action, props.row, props.index);
</script>
