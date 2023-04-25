<template>
  <component class="tmagic-design-badge" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMBadge">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  value?: string | number;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  max?: number;
  isDot?: boolean;
  hidden?: boolean;
}>();

const uiComponent = getConfig('components').badge;

const uiProps = computed(() => uiComponent.props(props));
</script>
