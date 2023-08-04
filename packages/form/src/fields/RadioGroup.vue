<template>
  <TMagicRadioGroup v-if="model" v-model="model[name]" :size="size" :disabled="disabled" @change="changeHandler">
    <TMagicRadio
      v-for="option in config.options"
      :label="option.value"
      :value="option.value"
      :key="`${option.value}`"
      >{{ option.text }}</TMagicRadio
    >
  </TMagicRadioGroup>
</template>

<script lang="ts" setup>
import { TMagicRadio, TMagicRadioGroup } from '@tmagic/design';

import type { FieldProps, RadioGroupConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormRadioGroup',
});

const props = defineProps<FieldProps<RadioGroupConfig>>();

const emit = defineEmits(['change']);

const changeHandler = (value: number) => {
  emit('change', value);
};

useAddField(props.prop);
</script>
