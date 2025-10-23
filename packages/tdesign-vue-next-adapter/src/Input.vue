<template>
  <TTextarea
    v-if="type === 'textarea'"
    :modelValue="modelValue"
    :size="size === 'default' ? 'medium' : size"
    :disabled="disabled"
    :placeholder="placeholder"
    :row="row"
    @keypress="inputHandler"
    @change="changeHandler"
  ></TTextarea>
  <TInputAdornment v-else>
    <template #prepend v-if="$slots.prepend">
      <slot name="prepend"></slot>
    </template>
    <template #append v-if="$slots.append">
      <slot name="append"></slot>
    </template>
    <TInput
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
  </TInputAdornment>
</template>

<script lang="ts" setup>
import { Input as TInput, InputAdornment as TInputAdornment, Textarea as TTextarea } from 'tdesign-vue-next';

import type { InputProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterInput',
});

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
