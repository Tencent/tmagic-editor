<template>
  <component class="tmagic-design-tooltip" :is="uiComponent.component" v-bind="uiProps">
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

const uiComponent = getConfig('components').tooltip;

const uiProps = computed(() => uiComponent.props(props));
</script>
