<template>
  <component :is="uiComponent.component" v-bind="uiProps" @command="commandHandler">
    <slot></slot>

    <template #dropdown>
      <slot name="dropdown"></slot>
    </template>
  </component>
</template>

<script setup lang="ts" name="TMDropdown">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  type?: string;
  size?: string;
  maxHeight?: string | number;
  splitButton?: boolean;
  disable?: boolean;
  placement?: string;
  trigger?: string;
  hideOnClick?: boolean;
  showTimeout?: number;
  role?: string;
  tabindex?: number;
  popperClass?: string;
  popperOptions?: any;
}>();

const uiComponent = getConfig('components').dropdown;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['command']);

const commandHandler = (...args: any[]) => {
  emit('command', ...args);
};
</script>
