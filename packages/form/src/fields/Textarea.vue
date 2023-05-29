<template>
  <TMagicInput
    v-model="model[name]"
    type="textarea"
    :size="size"
    clearable
    :placeholder="config.placeholder"
    :disabled="disabled"
    @change="changeHandler"
    @input="inputHandler"
  >
  </TMagicInput>
</template>

<script lang="ts" setup>
import { inject } from 'vue';

import { TMagicInput } from '@tmagic/design';

import { FormState, TextareaConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormTextarea',
});

const props = defineProps<{
  config: TextareaConfig;
  model: any;
  initValues?: any;
  values?: any;
  name: string;
  prop: string;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
  lastValues?: Record<string, any>;
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
