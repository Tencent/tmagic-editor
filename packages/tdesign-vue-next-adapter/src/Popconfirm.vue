<template>
  <TPopconfirm
    :content="title"
    :placement="placement"
    :popup-props="popupProps"
    @confirm="confirmHandler"
    @cancel="cancelHandler"
  >
    <template #default>
      <slot name="reference"></slot>
    </template>
  </TPopconfirm>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Popconfirm as TPopconfirm } from 'tdesign-vue-next';

import type { PopconfirmProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterPopconfirm',
});

const props = defineProps<PopconfirmProps>();

const emit = defineEmits(['confirm', 'cancel']);

const popupProps = computed(() => {
  if (!props.width) return undefined;
  const width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  return { overlayInnerStyle: { width } };
});

const confirmHandler = (...args: any[]) => {
  emit('confirm', ...args);
};

const cancelHandler = (...args: any[]) => {
  emit('cancel', ...args);
};
</script>
