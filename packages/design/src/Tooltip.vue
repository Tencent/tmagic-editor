<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <template #content>
      <slot name="content"></slot>
    </template>
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMTooltip">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  placement?: string;
  disabled?: boolean;
  content?: string;
  effect?: string;
  transition?: string;
  offset?: number;
}>();

const uiComponent = getConfig('components').tooltip;

const uiProps = computed(() => uiComponent.props(props));
</script>
