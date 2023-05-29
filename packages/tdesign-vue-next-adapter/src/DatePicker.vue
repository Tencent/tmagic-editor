<template>
  <TDateRangePicker
    v-if="type.endsWith('range')"
    :modelValue="modelValue"
    :mode="mode"
    :placeholder="[startPlaceholder || '', endPlaceholder || '']"
    :disabled="disabled"
    :size="size === 'default' ? 'medium' : size"
    :separator="rangeSeparator"
    :format="format"
    :valueType="valueFormat === 's' ? 'time-stamp' : valueFormat"
    @change="changeHandler"
    @update:modelValue="updateModelValue"
  />
  <TDatePicker
    v-else
    :modelValue="modelValue"
    :mode="mode"
    :placeholder="placeholder"
    :disabled="disabled"
    :size="size === 'default' ? 'medium' : size"
    :format="format"
    :enableTimePicker="type.includes('time')"
    :valueType="valueFormat === 's' ? 'time-stamp' : valueFormat"
    @change="changeHandler"
    @update:modelValue="updateModelValue"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { DatePicker as TDatePicker, DateRangePicker as TDateRangePicker } from 'tdesign-vue-next';

import type { DatePickerProps } from '@tmagic/design';

const props = withDefaults(
  defineProps<
    DatePickerProps & {
      valueFormat: any;
    }
  >(),
  {
    type: 'date',
  },
);

const mode = computed(() => {
  const map: any = {
    datetime: 'date',
    daterange: 'date',
    monthrange: 'month',
    datetimerange: 'date',
  };
  return map[props.type] || props.type;
});

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (...args: any[]) => {
  emit('update:modelValue', ...args);
};
</script>
