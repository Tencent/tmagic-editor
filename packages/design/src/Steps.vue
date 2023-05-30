<template>
  <component class="tmagic-design-steps" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { StepsProps } from './types';

defineOptions({
  name: 'TMSteps',
});

const props = defineProps<StepsProps>();

const ui = getConfig('components')?.steps;

const uiComponent = ui?.component || 'el-steps';

const uiProps = computed(() => ui?.props(props) || props);
</script>
