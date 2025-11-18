<template>
  <TMagicInputNumber
    v-if="model"
    v-model="value"
    clearable
    controls-position="right"
    :size="size"
    :max="config.max"
    :min="config.min"
    :step="config.step"
    :placeholder="config.placeholder"
    :disabled="disabled"
    @change="changeHandler"
    @input="inputHandler"
  ></TMagicInputNumber>
</template>

<script lang="ts" setup>
import { inject, ref, watch } from 'vue';

import { TMagicInputNumber } from '@tmagic/design';

import type { FieldProps, FormState, NumberConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormNumber',
});

const props = defineProps<FieldProps<NumberConfig>>();

const emit = defineEmits<{
  change: [values: number];
  input: [values: number];
}>();

const value = ref<number>();

watch(
  () => props.model[props.name],
  (v) => {
    value.value = v;
  },
  {
    immediate: true,
  },
);

useAddField(props.prop);

const mForm = inject<FormState | null>('mForm');

const changeHandler = (value: number) => {
  emit('change', value);
};

const inputHandler = (v: number) => {
  emit('input', v);
  mForm?.$emit('field-input', props.prop, v);
};
</script>
