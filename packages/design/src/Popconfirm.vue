<template>
  <component
    class="tmagic-design-popconfirm"
    :is="uiComponent"
    v-bind="uiProps"
    @confirm="confirmHandler"
    @cancel="cancelHandler"
  >
    <template #reference>
      <slot name="reference"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import type { PopconfirmProps } from './types';

defineOptions({
  name: 'TMPopconfirm',
});

const emit = defineEmits(['confirm', 'cancel']);

const props = defineProps<PopconfirmProps>();

const ui = getDesignConfig('components')?.popconfirm;

const uiComponent = ui?.component || 'el-popconfirm';

const uiProps = computed<PopconfirmProps>(() => ui?.props(props) || props);

const confirmHandler = (...args: any[]) => {
  emit('confirm', ...args);
};

const cancelHandler = (...args: any[]) => {
  emit('cancel', ...args);
};
</script>
