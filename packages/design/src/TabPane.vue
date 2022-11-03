<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <template #default>
      <slot></slot>
    </template>

    <template #label v-if="$slots.label">
      <slot name="label"></slot>
    </template>
  </component>
</template>

<script setup lang="ts" name="TMTabPane">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  name?: string;
  label?: string;
  lazy?: boolean;
}>();
const uiComponent = getConfig('components').tabPane;

const uiProps = computed(() => uiComponent.props(props));
</script>
