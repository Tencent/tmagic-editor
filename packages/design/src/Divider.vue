<template>
  <component class="tmagic-design-divider" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import type { DividerProps } from './types';

defineOptions({
  name: 'TMDivider',
});

const props = defineProps<DividerProps>();

const ui = getDesignConfig('components')?.divider;

const uiComponent = ui?.component || 'el-divider';

const uiProps = computed<DividerProps>(() => ui?.props(props) || props);
</script>
