<template>
  <component class="tmagic-design-step" :is="uiComponent.component" v-bind="uiProps" @click="clickHandler">
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

const uiComponent = getConfig('components').step;

const uiProps = computed(() => uiComponent.props(props));
</script>
