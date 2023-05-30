<template>
  <component class="tmagic-design-step" :is="uiComponent" v-bind="uiProps" @click="clickHandler">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { StepProps } from './types';

defineOptions({
  name: 'TMStep',
});

const props = defineProps<StepProps>();

const emit = defineEmits(['click']);

const clickHandler = (...args: any[]) => {
  emit('click', ...args);
};

const ui = getConfig('components')?.step;

const uiComponent = ui?.component || 'el-step';

const uiProps = computed(() => ui?.props(props) || props);
</script>
