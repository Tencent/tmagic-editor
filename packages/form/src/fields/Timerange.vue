<template>
  <TMagicTimePicker
    v-model="value"
    is-range
    range-separator="-"
    start-placeholder="开始时间"
    end-placeholder="结束时间"
    :size="size"
    :unlink-panels="true"
    :disabled="disabled"
    :default-time="config.defaultTime"
    :format="config.format || 'HH:mm:ss'"
    :value-format="config.valueFormat || 'HH:mm:ss'"
    @change="changeHandler"
  ></TMagicTimePicker>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, watch } from 'vue';
import dayjs from 'dayjs';

import { TMagicTimePicker } from '@tmagic/design';

import type { ChangeRecord, FieldProps, TimerangeConfig } from '../schema';
import { datetimeFormatter, normalizeTimestampValue } from '../utils/form';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormTimeRange',
});

const props = defineProps<FieldProps<TimerangeConfig>>();

const emit = defineEmits(['change']);

useAddField(props.prop);

const { names } = props.config;
const value = ref<(Date | string | number | undefined)[] | null>([]);

const getFullDatetime = (item: string) => (item ? `${dayjs().format('YYYY/MM/DD')} ${item}` : '');
const getFormat = () => `YYYY/MM/DD ${props.config.valueFormat || 'HH:mm:ss'}`;
const timeFormatter = (time: string, format: string) =>
  (datetimeFormatter(getFullDatetime(time), '', format) as string).substring(11);
/** `X` 的选择器值就是秒级数字，不能再拼成日期后截取。 */
const toPickerValue = (time: string | number) => {
  if (!time) return undefined;
  if (props.config.valueFormat === 'X') return normalizeTimestampValue(time, 'X');
  return timeFormatter(time as string, getFormat());
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
  } else if (props.name) {
    const unWatch = watch(
      () => props.model[props.name],
      (v = []) => {
        if (Array.isArray(v)) {
          value.value = v.map((item: string | number) => toPickerValue(item));
        } else {
          value.value = [];
        }
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
