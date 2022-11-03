<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMRadio">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  label?: string | number | boolean;
}>();

const uiComponent = getConfig('components').radio;

const uiProps = computed(() => uiComponent.props(props));
</script>
