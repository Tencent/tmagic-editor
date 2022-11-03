<template>
  <component
    :is="uiComponent.component"
    v-bind="uiProps"
    @change="changeHandler"
    @input="inputHandler"
    @update:modelValue="updateModelValue"
  ></component>
</template>

<script setup lang="ts" name="TMInputNumber">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  modelValue?: string | number | boolean;
  clearable?: boolean;
  controlsPosition?: string;
  disabled?: boolean;
  placeholder?: string;
  step?: number;
  min?: number;
  max?: number;
  size?: 'mini' | 'small' | 'medium';
}>();

const uiComponent = getConfig('components').inputNumber;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'input', 'update:modelValue']);

const changeHandler = (...args: any[]) => {
  emit('change', ...args);
};

const inputHandler = (...args: any[]) => {
  emit('input', ...args);
};

const updateModelValue = (...args: any[]) => {
  emit('update:modelValue', ...args);
};
</script>
