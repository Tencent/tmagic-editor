<template>
  <TMagicDatePicker
    v-model="value"
    type="datetimerange"
    range-separator="-"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    :size="size"
    :unlink-panels="true"
    :disabled="disabled"
    :default-time="config.defaultTime"
    :value-format="config.valueFormat || 'YYYY/MM/DD HH:mm:ss'"
    :date-format="config.dateFormat || 'YYYY/MM/DD'"
    :time-format="config.timeFormat || 'HH:mm:ss'"
    @change="changeHandler"
  ></TMagicDatePicker>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

import { TMagicDatePicker } from '@tmagic/design';

import type { DaterangeConfig, FieldProps } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDateRange',
});

const props = defineProps<FieldProps<DaterangeConfig>>();

const emit = defineEmits(['change']);

useAddField(props.prop);

const { names } = props.config;
const value = ref<(Date | undefined)[] | null>([]);

if (props.model !== undefined) {
  if (names?.length) {
    watch(
      [() => props.model[names[0]], () => props.model[names[1]]],
      ([start, end], [preStart, preEnd]) => {
        if (!value.value) {
          value.value = [];
        }
        if (!start || !end) value.value = [];
        if (start !== preStart) value.value[0] = start;
        if (end !== preEnd) value.value[1] = end;
      },
      {
        immediate: true,
      },
    );
  } else if (props.name && props.model[props.name]) {
    watch(
      () => props.model[props.name],
      (start) => {
        value.value = start;
      },
      {
        immediate: true,
      },
    );
  }
}

const setValue = (v: Date[] | Date) => {
  names?.forEach((item, index) => {
    if (!props.model) {
      return;
    }
    if (Array.isArray(v)) {
      props.model[item] = v[index];
    } else {
      props.model[item] = undefined;
    }
  });
};

const changeHandler = (v: Date[]) => {
  const value = v || [];

  if (props.name) {
    emit('change', value);
  } else {
    if (names?.length) {
      setValue(value);
    }
    emit('change', props.model);
  }
};
</script>
