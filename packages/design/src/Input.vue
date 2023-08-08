<template>
  <component
    ref="instance"
    class="tmagic-design-input"
    :is="uiComponent"
    v-bind="uiProps"
    @change="changeHandler"
    @input="inputHandler"
    @update:modelValue="updateModelValue"
  >
    <template #prepend v-if="$slots.prepend">
      <slot name="prepend"></slot>
    </template>
    <template #append v-if="$slots.append">
      <slot name="append"></slot>
    </template>
    <template #prefix v-if="$slots.prefix">
      <slot name="prefix"></slot>
    </template>
    <template #suffix v-if="$slots.suffix">
      <slot name="suffix"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { getConfig } from './config';
import type { InputProps } from './types';

defineOptions({
  name: 'TMInput',
});

const props = defineProps<InputProps>();

const ui = getConfig('components')?.input;

const uiComponent = ui?.component || 'el-input';

const uiProps = computed(() => ui?.props(props) || props);

const emit = defineEmits(['change', 'input', 'update:modelValue']);

const instance = ref<any>();

const changeHandler = (...args: any[]) => {
  emit('change', ...args);
};

const inputHandler = (...args: any[]) => {
  emit('input', ...args);
};

const updateModelValue = (...args: any[]) => {
  emit('update:modelValue', ...args);
};

defineExpose({
  instance,
  getInput() {
    return instance.value.input;
  },
  getTextarea() {
    return instance.value.textarea;
  },
});
</script>
