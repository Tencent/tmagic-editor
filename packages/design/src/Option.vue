<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMOption">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  value?: any;
  label?: string;
  disabled?: boolean;
}>();

const uiComponent = getConfig('components').option;

const uiProps = computed(() => uiComponent.props(props));
</script>
