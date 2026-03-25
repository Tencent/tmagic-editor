<template>
  <component class="tmagic-design-card" :is="uiComponent" v-bind="uiProps">
    <template #header v-if="$slots.header">
      <slot name="header" class="header"></slot>
    </template>

    <template #default v-if="$slots.default">
      <slot name="default"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import type { CardProps } from './types';

defineOptions({
  name: 'TMCard',
});

const props = defineProps<CardProps>();

const ui = getDesignConfig('components')?.card;

const uiComponent = ui?.component || 'el-card';

const uiProps = computed<CardProps>(() => ui?.props(props) || props);
</script>
