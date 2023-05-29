<template>
  <TTextarea
    v-if="type === 'textarea'"
    :modelValue="modelValue"
    :size="size === 'default' ? 'medium' : size"
    :disabled="disabled"
    :placeholder="placeholder"
    @keypress="inputHandler"
    @change="changeHandler"
  ></TTextarea>
  <TInput
    v-else
    :modelValue="modelValue"
    :size="size === 'default' ? 'medium' : size"
    :clearable="clearable"
    :disabled="disabled"
    :placeholder="placeholder"
    @keypress="inputHandler"
    @change="changeHandler"
    @update:modelValue="updateModelValue"
  >
    <template #prefix-icon v-if="$slots.prefix">
      <slot name="prefix"></slot>
    </template>
    <template #suffix v-if="$slots.suffix">
      <slot name="suffix"></slot>
    </template>
  </TInput>
</template>

<script lang="ts" setup>
import { Input as TInput, Textarea as TTextarea } from 'tdesign-vue-next';

import type { InputProps } from '@tmagic/design';

defineProps<
  InputProps & {
    modelValue: string;
  }
>();

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
