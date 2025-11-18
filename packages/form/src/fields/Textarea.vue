<template>
  <TMagicInput
    v-model="value"
    type="textarea"
    :size="size"
    clearable
    :placeholder="config.placeholder"
    :disabled="disabled"
    :rows="config.rows"
    @change="changeHandler"
    @input="inputHandler"
  >
  </TMagicInput>
</template>

<script lang="ts" setup>
import { inject, ref, watch } from 'vue';

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

const value = ref('');

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

const changeHandler = (value: string) => {
  emit('change', value);
};

const inputHandler = (v: string) => {
  emit('input', v);
  mForm?.$emit('field-input', props.prop, v);
};
</script>
