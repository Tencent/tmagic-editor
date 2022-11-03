<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMTag">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  type?: string;
  closeTransition?: boolean;
}>();

const uiComponent = getConfig('components').tag;

const uiProps = computed(() => uiComponent.props(props));
</script>
