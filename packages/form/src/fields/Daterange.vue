<template>
  <TMagicDatePicker
    :model-value="value"
    type="datetimerange"
    range-separator="-"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    :size="size"
    :unlink-panels="true"
    :disabled="disabled"
    :default-time="config.defaultTime"
    :format="`${config.dateFormat || 'YYYY/MM/DD'} ${config.timeFormat || 'HH:mm:ss'}`"
    :value-format="config.valueFormat || 'YYYY/MM/DD HH:mm:ss'"
    :date-format="config.dateFormat || 'YYYY/MM/DD'"
    :time-format="config.timeFormat || 'HH:mm:ss'"
    @update:model-value="changeHandler"
  ></TMagicDatePicker>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, watch } from 'vue';

import { TMagicDatePicker } from '@tmagic/design';

import type { ChangeRecord, DaterangeConfig, FieldProps } from '../schema';
import { datetimeFormatter, normalizeTimestampValue } from '../utils/form';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDateRange',
});

const props = defineProps<FieldProps<DaterangeConfig>>();

const emit = defineEmits(['change']);

useAddField(props.prop);

const { names } = props.config;
const value = ref<(Date | string | number | undefined)[] | null>([]);
const rangeFormat = () => `${props.config.dateFormat || 'YYYY/MM/DD'} ${props.config.timeFormat || 'HH:mm:ss'}`;
/** `X` 的选择器值就是秒级数字，展示格式不能拿去代替 valueFormat。 */
const toPickerValue = (item: string | number | Date) => {
  if (!item) return undefined;
  if (props.config.valueFormat === 'X') return normalizeTimestampValue(item, 'X');
  return datetimeFormatter(item, '', rangeFormat()) as string;
};

if (props.model !== undefined) {
  if (names?.length) {
    const unWatch = watch(
      [() => props.model[names[0]], () => props.model[names[1]]],
      ([start, end], [preStart, preEnd]) => {
        if (!value.value) {
          value.value = [];
        }

        if (!start || !end) value.value = [];
        if (start !== preStart) value.value[0] = toPickerValue(start);
        if (end !== preEnd) value.value[1] = toPickerValue(end);
      },
      {
        immediate: true,
      },
    );

    onUnmounted(() => {
      unWatch();
    });
  } else if (props.name && props.model[props.name]) {
    const unWatch = watch(
      () => props.model[props.name],
      (start, preStart) => {
        if (start !== preStart) value.value = start.map((item: string | number | Date) => toPickerValue(item));
      },
      {
        immediate: true,
      },
    );
    onUnmounted(() => {
      unWatch();
    });
  }
}

const changeHandler = (v: Array<Date | string | number> | null) => {
  const normalized = normalizeTimestampValue(v, props.config.valueFormat);
  const value = normalized || [];

  if (props.name) {
    emit('change', value);
  } else {
    if (props.config.names?.length) {
      const newChangeRecords: ChangeRecord[] = [];
      props.config.names.forEach((item, index) => {
        if (!props.model) {
          return;
        }
        if (Array.isArray(normalized)) {
          newChangeRecords.push({
            propPath: props.prop ? `${props.prop}.${item}` : item,
            value: normalized[index],
          });
        } else {
          newChangeRecords.push({
            propPath: props.prop ? `${props.prop}.${item}` : item,
            value: undefined,
          });
        }
      });

      emit('change', props.model, {
        changeRecords: newChangeRecords,
      });
    }
  }
};
</script>
