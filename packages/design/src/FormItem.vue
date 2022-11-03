<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <template #label>
      <slot name="label"></slot>
    </template>
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMFormItem">
import { computed } from 'vue';

import { getConfig } from './config';
const props = defineProps<{
  prop?: string;
  labelWidth?: string;
  rules?: any;
}>();

const uiComponent = getConfig('components').formItem;

const uiProps = computed(() => uiComponent.props(props));
</script>
