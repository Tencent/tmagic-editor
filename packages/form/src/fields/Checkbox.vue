<template>
  <TMagicCheckbox
    v-model="model[name]"
    :size="size"
    :trueValue="activeValue"
    :falseValue="inactiveValue"
    :disabled="disabled"
    @change="changeHandler"
    >{{ config.text }}</TMagicCheckbox
  >
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { TMagicCheckbox } from '@tmagic/design';

import type { CheckboxConfig, FieldProps } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormCheckbox',
});

const props = defineProps<FieldProps<CheckboxConfig>>();

const emit = defineEmits(['change']);

useAddField(props.prop);

const activeValue = computed(() => {
  if (typeof props.config.activeValue === 'undefined') {
    if (props.config.filter === 'number') {
      return 1;
    }
  } else {
    return props.config.activeValue;
  }

  return undefined;
});

const inactiveValue = computed(() => {
  if (typeof props.config.inactiveValue === 'undefined') {
    if (props.config.filter === 'number') {
      return 0;
    }
  } else {
    return props.config.inactiveValue;
  }

  return undefined;
});

const changeHandler = (value: number | boolean) => {
  emit('change', value);
};
</script>
