<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>

    <template #reference>
      <slot name="reference"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  placement?: string;
  width?: string;
  trigger?: string;
}>();

const uiComponent = getConfig('components').popover;

const uiProps = computed(() => uiComponent.props(props));
</script>
