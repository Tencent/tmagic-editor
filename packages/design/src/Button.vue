<template>
  <component class="tmagic-design-button" :is="uiComponent.component" v-bind="uiProps" @click="clickHandler">
    <template #default v-if="$slots.default">
      <slot></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { ButtonProps } from './types';

defineOptions({
  name: 'TMButton',
});

const props = defineProps<ButtonProps>();

const uiComponent = getConfig('components').button;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['click']);

const clickHandler = (...args: any[]) => {
  emit('click', ...args);
};
</script>
