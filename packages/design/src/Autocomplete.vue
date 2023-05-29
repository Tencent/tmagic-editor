<template>
  <component
    class="tmagic-design-auto-complete"
    ref="autocomplete"
    :is="uiComponent.component"
    v-bind="uiProps"
    @change="changeHandler"
    @select="selectHandler"
    @update:modelValue="updateModelValue"
  >
    <template #defalut="{ item }" v-if="$slots.defalut">
      <slot name="defalut" :item="item"></slot>
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

<script setup lang="ts" name="TMAutocomplete">
import { computed, ref, watchEffect } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
  label?: string;
  clearable?: boolean;
  disabled?: boolean;
  triggerOnFocus?: boolean;
  valueKey?: string;
  debounce?: number;
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';
  fetchSuggestions?: (queryString: string, callback: (data: any[]) => any) => void;
}>();

const uiComponent = getConfig('components').autocomplete;

const uiProps = computed(() => uiComponent.props(props));

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
