<template>
  <component class="tmagic-design-card" :is="uiComponent" v-bind="uiProps">
    <template #header>
      <slot name="header" class="header"></slot>
    </template>

    <template #default>
      <slot name="default"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { CardProps } from './types';

defineOptions({
  name: 'TMCard',
});

const props = defineProps<CardProps>();

const ui = getConfig('components')?.card;

const uiComponent = ui?.component || 'el-card';

const uiProps = computed(() => ui?.props(props) || props);
</script>
