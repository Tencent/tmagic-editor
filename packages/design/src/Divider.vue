<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMDivider">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  direction?: string;
  borderStyle?: string;
  contentPosition?: string;
}>();

const uiComponent = getConfig('components').divider;

const uiProps = computed(() => uiComponent.props(props));
</script>
