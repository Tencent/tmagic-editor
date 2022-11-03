<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMSteps">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  active?: number;
  space?: number | string;
}>();

const uiComponent = getConfig('components').steps;

const uiProps = computed(() => uiComponent.props(props));
</script>
