<template>
  <component class="tmagic-design-tooltip" :is="uiComponent" v-bind="uiProps">
    <template #content>
      <slot name="content"></slot>
    </template>
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { TooltipProps } from './types';

defineOptions({
  name: 'TMTooltip',
});

const props = defineProps<TooltipProps>();

const ui = getConfig('components')?.tooltip;

const uiComponent = ui?.component || 'el-tooltip';

const uiProps = computed(() => ui?.props(props) || props);
</script>
