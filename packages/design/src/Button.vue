<template>
  <component :is="uiComponent.component" v-bind="uiProps" @click="clickHandler">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMButton">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  type?: string;
  size?: string;
  text?: boolean;
  icon?: any;
}>();

const uiComponent = getConfig('components').button;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['click']);

const clickHandler = (...args: any[]) => {
  emit('click', ...args);
};
</script>
