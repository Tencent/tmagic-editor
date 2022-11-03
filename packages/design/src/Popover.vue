<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>

    <template #reference>
      <slot name="reference"></slot>
    </template>
  </component>
</template>

<script setup lang="ts" name="TMPopover">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  placement?: string;
  width?: string | number;
  title?: string;
  trigger?: string;
  effect?: string;
  content?: string;
  disabled?: boolean;
  popperClass?: string;
}>();

const uiComponent = getConfig('components').popover;

const uiProps = computed(() => uiComponent.props(props));
</script>
