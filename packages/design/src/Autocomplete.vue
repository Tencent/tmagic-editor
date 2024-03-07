<template>
  <component
    class="tmagic-design-auto-complete"
    ref="autocomplete"
    :is="uiComponent"
    v-bind="uiProps"
    @change="changeHandler"
    @select="selectHandler"
    @update:modelValue="updateModelValue"
  >
    <template #default="{ item }" v-if="$slots.default">
      <slot name="default" :item="item"></slot>
    </template>
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
import { computed, ref, watchEffect } from 'vue';

import { getConfig } from './config';
import type { AutocompleteProps } from './types';

defineOptions({
  name: 'TMAutocomplete',
});

const props = defineProps<AutocompleteProps>();

const ui = getConfig('components')?.autocomplete;

const uiComponent = ui?.component || 'el-autocomplete';

const uiProps = computed(() => ui?.props(props) || props);

const emit = defineEmits(['change', 'select', 'update:modelValue']);

const changeHandler = (...args: any[]) => {
  emit('change', ...args);
};

const selectHandler = (...args: any[]) => {
  emit('select', ...args);
};

const updateModelValue = (...args: any[]) => {
  emit('update:modelValue', ...args);
};

const autocomplete = ref<any>();
const input = ref<HTMLInputElement>();
const inputRef = ref<any>();

watchEffect(() => {
  inputRef.value = autocomplete.value?.inputRef;
  input.value = autocomplete.value?.inputRef.input;
});

defineExpose({
  inputRef,
  input,

  blur: () => {
    autocomplete.value?.blur();
  },
  focus: () => {
    autocomplete.value?.focus();
  },
});
</script>
