<template>
  <div class="m-fields-number-range">
    <TMagicInput
      v-model="model[name][0]"
      clearable
      :size="size"
      :disabled="disabled"
      @change="minChangeHandler"
    ></TMagicInput>
    <span class="split-tag">-</span>
    <TMagicInput
      v-model="model[name][1]"
      clearable
      :size="size"
      :disabled="disabled"
      @change="maxChangeHandler"
    ></TMagicInput>
  </div>
</template>

<script lang="ts" setup>
import { TMagicInput } from '@tmagic/design';

import type { FieldProps, NumberRangeConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormNumberRange',
});

const props = defineProps<FieldProps<NumberRangeConfig>>();

const emit = defineEmits<{
  change: [values: [number, number]];
}>();

useAddField(props.prop);

if (!Array.isArray(props.model[props.name])) {
  props.model[props.name] = [];
}

const minChangeHandler = (v: string) => {
  emit('change', [Number(v), props.model[props.name][1]]);
};

const maxChangeHandler = (v: string) => {
  emit('change', [props.model[props.name][0], Number(v)]);
};
</script>
