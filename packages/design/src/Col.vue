<template>
  <component class="tmagic-design-col" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { ColProps } from './types';

defineOptions({
  name: 'TMCol',
});

const props = defineProps<ColProps>();

const ui = getConfig('components')?.col;

const uiComponent = ui?.component || 'el-col';

const uiProps = computed(() => ui?.props(props) || props);
</script>
