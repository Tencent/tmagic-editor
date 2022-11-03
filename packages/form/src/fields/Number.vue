<template>
  <TMagicInputNumber
    v-if="model"
    v-model="model[name]"
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

<script lang="ts" setup name="MFormNumber">
import { inject } from 'vue';

import { TMagicInputNumber } from '@tmagic/design';

import { FormState, NumberConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

const props = defineProps<{
  config: NumberConfig;
  model: any;
  initValues?: any;
  values?: any;
  name: string;
  prop: string;
  disabled?: boolean;
  size: 'mini' | 'small' | 'medium';
}>();

const emit = defineEmits(['change', 'input']);

useAddField(props.prop);

const mForm = inject<FormState | null>('mForm');

const changeHandler = (value: number) => {
  emit('change', value);
};

const inputHandler = (v: string) => {
  emit('input', v);
  mForm?.$emit('field-input', props.prop, v);
};
</script>
