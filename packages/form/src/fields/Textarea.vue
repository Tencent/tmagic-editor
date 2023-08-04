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

import type { FieldProps, FormState, TextareaConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormTextarea',
});

const props = defineProps<FieldProps<TextareaConfig>>();

const emit = defineEmits<{
  change: [value: string];
  input: [value: string];
}>();

useAddField(props.prop);

const mForm = inject<FormState | null>('mForm');

const changeHandler = (value: string) => {
  emit('change', value);
};

const inputHandler = (v: string) => {
  emit('input', v);
  mForm?.$emit('field-input', props.prop, v);
};
</script>
