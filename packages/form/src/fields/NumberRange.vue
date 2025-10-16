<template>
  <div class="m-fields-number-range">
    <TMagicInput
      :model-value="model[name][0]"
      :clearable="config.clearable ?? true"
      :size="size"
      :disabled="disabled"
      @update:model-value="minChangeHandler"
    ></TMagicInput>
    <span class="split-tag">-</span>
    <TMagicInput
      :model-value="model[name][1]"
      :clearable="config.clearable ?? true"
      :size="size"
      :disabled="disabled"
      @update:model-value="maxChangeHandler"
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
