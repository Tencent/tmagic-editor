<template>
  <component :is="uiComponent.component" v-bind="uiProps" @click="clickHandler">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMStep">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  title?: string;
  active?: number;
}>();

const emit = defineEmits(['click']);

const clickHandler = (...args: any[]) => {
  emit('click', ...args);
};

const uiComponent = getConfig('components').step;

const uiProps = computed(() => uiComponent.props(props));
</script>
