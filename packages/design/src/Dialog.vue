<template>
  <component
    class="tmagic-design-dialog"
    :is="uiComponent"
    v-bind="uiProps"
    @close="closeHandler"
    @update:modelValue="updateModelValue"
  >
    <slot></slot>

    <template #footer>
      <slot name="footer"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import type { DialogProps } from './types';

defineOptions({
  name: 'TMDialog',
});

const props = defineProps<DialogProps>();

const emit = defineEmits(['close', 'update:modelValue']);

const ui = getDesignConfig('components')?.dialog;

const uiComponent = ui?.component || 'el-dialog';

const uiProps = computed<DialogProps>(() => ui?.props(props) || props);

const closeHandler = (...args: any[]) => {
  emit('close', ...args);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
