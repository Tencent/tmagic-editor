<template>
  <TTextarea
    v-if="type === 'textarea'"
    ref="textarea"
    :modelValue="modelValue"
    :size="size === 'default' ? 'medium' : size"
    :disabled="disabled"
    :placeholder="placeholder"
    :rows="rows"
    :autosize="autosize"
    @keypress="inputHandler"
    @change="changeHandler"
    @blur="blurHandler"
    @focus="focusHandler"
    @update:modelValue="updateModelValue"
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
      @blur="blurHandler"
      @focus="focusHandler"
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
import { useTemplateRef, watch } from 'vue';
import { Input as TInput, InputAdornment as TInputAdornment, Textarea as TTextarea } from 'tdesign-vue-next';

import type { InputProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterInput',
});

const props = defineProps<
  InputProps & {
    modelValue: string;
  }
>();

const emit = defineEmits(['change', 'input', 'blur', 'focus', 'update:modelValue']);

const textareaRef = useTemplateRef('textarea');

watch(
  [textareaRef, () => props.rows],
  ([val, rows]) => {
    if (val && rows) {
      const el = val.$el.querySelector('textarea');
      if (el) {
        el.rows = rows;
      }
    }
  },
  { immediate: true },
);

const changeHandler = (...args: any[]) => {
  emit('change', ...args);
};

const inputHandler = (...args: any[]) => {
  emit('input', ...args);
};

const blurHandler = (...args: any[]) => {
  emit('blur', ...args);
};

const focusHandler = (...args: any[]) => {
  emit('focus', ...args);
};

const updateModelValue = (...args: any[]) => {
  emit('update:modelValue', ...args);
};
</script>
