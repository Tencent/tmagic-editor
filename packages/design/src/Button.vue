<template>
  <component class="tmagic-design-button" :is="uiComponent" v-bind="uiProps" @click="clickHandler">
    <template #default v-if="$slots.default">
      <slot></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { ButtonProps } from './types';

defineOptions({
  name: 'TMButton',
});

const props = defineProps<ButtonProps>();

const ui = getConfig('components')?.button;

const uiComponent = ui?.component || 'el-button';

const uiProps = computed(() => ui?.props(props) || props);

const emit = defineEmits(['click']);

const clickHandler = (...args: any[]) => {
  emit('click', ...args);
};
</script>
