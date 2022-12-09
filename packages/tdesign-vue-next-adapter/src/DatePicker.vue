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

const props = withDefaults(
  defineProps<{
    type?: any;
    modelValue?: any;
    disabled?: boolean;
    placeholder?: string;
    rangeSeparator?: string;
    startPlaceholder?: string;
    endPlaceholder?: string;
    format?: string;
    /** 可选，绑定值的格式。 不指定则绑定值为 Date 对象 */
    valueFormat?: any;
    /** 在范围选择器里取消两个日期面板之间的联动 */
    unlinkPanels?: boolean;
    defaultTime?: any;
    size?: 'large' | 'default' | 'small';
  }>(),
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
