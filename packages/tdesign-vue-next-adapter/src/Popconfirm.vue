<template>
  <TPopconfirm :content="title" :placement="placement" @confirm="confirmHandler" @cancel="cancelHandler">
    <template #default>
      <slot name="reference"></slot>
    </template>
  </TPopconfirm>
</template>

<script setup lang="ts">
import { Popconfirm as TPopconfirm } from 'tdesign-vue-next';

import type { PopconfirmProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterPopconfirm',
});

defineProps<PopconfirmProps>();

const emit = defineEmits(['confirm', 'cancel']);

const confirmHandler = (...args: any[]) => {
  emit('confirm', ...args);
};

const cancelHandler = (...args: any[]) => {
  emit('cancel', ...args);
};
</script>
