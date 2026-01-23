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

import type { ChangeRecord, DaterangeConfig, FieldProps } from '../schema';
import { datetimeFormatter } from '../utils/form';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormTimeRange',
});

const props = defineProps<FieldProps<DaterangeConfig>>();

const emit = defineEmits(['change']);

useAddField(props.prop);

const { names } = props.config;
const value = ref<(Date | string | undefined)[] | null>([]);

const getFullDatetime = (item: string) => (item ? `${dayjs().format('YYYY/MM/DD')} ${item}` : '');
const getFormat = () => `YYYY/MM/DD ${props.config.valueFormat || 'HH:mm:ss'}`;
const timeFormatter = (time: string, format: string) =>
  (datetimeFormatter(getFullDatetime(time), '', format) as string).substring(11);

if (props.model !== undefined) {
  if (names?.length) {
    const unWatch = watch(
      [() => props.model[names[0]], () => props.model[names[1]]],
      ([start, end], [preStart, preEnd]) => {
        if (!value.value) {
          value.value = [];
        }

        const format = getFormat();
        if (!start || !end) value.value = [];
        if (start !== preStart) value.value[0] = timeFormatter(start, format);
        if (end !== preEnd) value.value[1] = timeFormatter(end, format);
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
          value.value = v.map((item: string) => (item ? timeFormatter(item, getFormat()) : undefined));
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

const changeHandler = (v: Date[]) => {
  const value = v || [];

  if (props.name) {
    emit('change', value);
  } else {
    if (props.config.names?.length) {
      const newChangeRecords: ChangeRecord[] = [];
      props.config.names.forEach((item, index) => {
        if (!props.model) {
          return;
        }
        if (Array.isArray(v)) {
          newChangeRecords.push({
            propPath: props.prop ? `${props.prop}.${item}` : item,
            value: v[index],
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
