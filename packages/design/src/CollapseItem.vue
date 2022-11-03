<template>
  <component :is="uiComponent.component" v-bind="uiProps" @update:modelValue="updateModelValue" @change="changeHandler">
    <slot></slot>
    <template #title>
      <slot name="title"></slot>
    </template>
  </component>
</template>

<script setup lang="ts" name="TMCollapseItem">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  name?: string | number;
  title?: string;
  disabled?: boolean;
}>();

const uiComponent = getConfig('components').collapseItem;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
