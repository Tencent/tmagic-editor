<template>
  <div class="m-fields-number-range">
    <TMagicInput
      v-model="firstValue"
      :clearable="config.clearable ?? true"
      :size="size"
      :disabled="disabled"
      @change="minChangeHandler"
    ></TMagicInput>
    <span class="split-tag">-</span>
    <TMagicInput
      v-model="secondValue"
      :clearable="config.clearable ?? true"
      :size="size"
      :disabled="disabled"
      @change="maxChangeHandler"
    ></TMagicInput>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

import { TMagicInput } from '@tmagic/design';

import type { FieldProps, NumberRangeConfig } from '@form/schema';
import { useAddField } from '@form/utils/useAddField';

defineOptions({
  name: 'MFormNumberRange',
});

const props = defineProps<FieldProps<NumberRangeConfig>>();

const emit = defineEmits<{
  change: [values: [number, number]];
}>();

const firstValue = ref<number>();
const secondValue = ref<number>();

watch(
  () => props.model[props.name],
  ([first, second]) => {
    firstValue.value = first;
    secondValue.value = second;
  },
  {
    immediate: true,
    deep: true,
  },
);

useAddField(props.prop);

const minChangeHandler = (v: string) => {
  emit('change', [Number(v), props.model[props.name][1]]);
};

const maxChangeHandler = (v: string) => {
  emit('change', [props.model[props.name][0], Number(v)]);
};
</script>
