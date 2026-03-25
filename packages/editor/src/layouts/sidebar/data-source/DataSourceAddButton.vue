<template>
  <TMagicPopover
    placement="right"
    trigger="hover"
    popper-class="data-source-list-panel-add-menu"
    :destroy-on-close="true"
  >
    <template #reference>
      <TMagicButton v-bind="addButtonConfig || {}">{{ addButtonText || '' }}</TMagicButton>
    </template>
    <ToolButton
      v-for="(item, index) in datasourceTypeList"
      :data="{
        type: 'button',
        text: item.text,
        handler: () => {
          $emit('add', item.type);
        },
      }"
      :key="index"
    ></ToolButton>
  </TMagicPopover>
</template>

<script setup lang="ts">
import { type ButtonProps, TMagicButton, TMagicPopover } from '@tmagic/design';

import ToolButton from '@editor/components/ToolButton.vue';

defineOptions({
  name: 'MEditorDataSourceAddButton',
});

defineProps<{
  datasourceTypeList: {
    text: string;
    type: string;
  }[];
  addButtonConfig?: ButtonProps;
  addButtonText?: string;
}>();

defineEmits<{
  add: [type: string];
}>();
</script>
