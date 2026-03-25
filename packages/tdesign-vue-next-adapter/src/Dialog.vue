<template>
  <TDialog
    :visible="modelValue"
    :attach="appendToBody ? 'body' : undefined"
    :header="title"
    :width="width"
    :mode="fullscreen ? 'full-screen' : 'modal'"
    :close-btn="showClose"
    :close-on-overlay-click="closeOnClickModal"
    :close-on-esc-keydown="closeOnPressEscape"
    :destroy-on-close="destroyOnClose"
    @before-open="beforeClose"
    @close="closeHandler"
    @update:visible="updateModelValue"
  >
    <slot></slot>

    <template #footer>
      <slot name="footer"></slot>
    </template>
  </TDialog>
</template>

<script setup lang="ts">
import { Dialog as TDialog } from 'tdesign-vue-next';

import type { DialogProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterDialog',
});

defineProps<DialogProps>();

const emit = defineEmits(['close', 'update:modelValue']);

const closeHandler = (...args: any[]) => {
  emit('close', ...args);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
