<template>
  <component :is="uiComponent.component" v-bind="uiProps" @update:modelValue="updateModelValue" @change="changeHandler">
    <template #default>
      <slot></slot>
    </template>
  </component>
</template>

<script setup lang="ts" name="TMSwitch">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  modelValue?: string | number | boolean;
  label?: any;
  activeValue?: string | number | boolean;
  inactiveValue?: string | number | boolean;
  disabled?: boolean;
  size?: 'mini' | 'small' | 'medium';
}>();

const uiComponent = getConfig('components').switch;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
