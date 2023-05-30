<template>
  <component
    class="tmagic-design-input-number"
    :is="uiComponent"
    v-bind="uiProps"
    @change="changeHandler"
    @input="inputHandler"
    @update:modelValue="updateModelValue"
  ></component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { InputNumberProps } from './types';

defineOptions({
  name: 'TMInputNumber',
});

const props = defineProps<InputNumberProps>();

const ui = getConfig('components')?.inputNumber;

const uiComponent = ui?.component || 'el-input-number';

const uiProps = computed(() => ui?.props(props) || props);

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
