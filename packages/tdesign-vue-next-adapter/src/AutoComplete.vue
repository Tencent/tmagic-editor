<template>
  <TAutoComplete
    ref="autocomplete"
    :model-value="modelValue"
    :options="options"
    :disabled="disabled"
    :placeholder="placeholder"
    :size="size === 'default' ? 'medium' : size"
    :popupProps="{
      trigger: props.triggerOnFocus ? 'focus' : 'hover',
    }"
    :filter="filterHandler"
    @keypress="inputHandler"
    @change="changeHandler"
    @blur="blurHandler"
    @focus="focusHandler"
    @click="clickHandler"
    @update:modelValue="updateModelValue"
  >
    <template #option="{ option }" v-if="$slots.default">
      <slot name="default" :item="option"></slot>
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
  </TAutoComplete>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { AutoComplete as TAutoComplete, type AutoCompleteOption } from 'tdesign-vue-next';

import type { AutocompleteProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterAutoComplete',
});

const emit = defineEmits(['change', 'input', 'blur', 'focus', 'click', 'update:modelValue']);

const props = defineProps<AutocompleteProps>();

const options = ref<any[]>([]);

onMounted(() => {
  if (typeof props.fetchSuggestions === 'function') {
    props.fetchSuggestions('', (data: any[]) => {
      options.value = data;
    });
  } else if (Array.isArray(props.fetchSuggestions)) {
    options.value = props.fetchSuggestions;
  }
});

const filterHandler = (keyword: string, _option: AutoCompleteOption) => {
  if (typeof props.fetchSuggestions === 'function') {
    props.fetchSuggestions(keyword, (data: any[]) => {
      options.value = data;
    });
  }

  return true;
};

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

const clickHandler = (...args: any[]) => {
  emit('click', ...args);
};

const updateModelValue = (...args: any[]) => {
  emit('update:modelValue', ...args);
};

defineExpose({
  blur: () => {},
  focus: () => {},
});
</script>
