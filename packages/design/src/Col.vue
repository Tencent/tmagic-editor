<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMCol">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  span?: number;
}>();

const uiComponent = getConfig('components').col;

const uiProps = computed(() => uiComponent.props(props));
</script>
