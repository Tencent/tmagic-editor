<template>
  <component class="tmagic-design-divider" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { DividerProps } from './types';

defineOptions({
  name: 'TMDivider',
});

const props = defineProps<DividerProps>();

const ui = getConfig('components')?.divider;

const uiComponent = ui?.component || 'el-divider';

const uiProps = computed(() => ui?.props(props) || props);
</script>
