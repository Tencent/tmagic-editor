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
import { datetimeFormatter } from '../utils/form';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDateRange',
});

const props = defineProps<FieldProps<DaterangeConfig>>();

const emit = defineEmits(['change']);

useAddField(props.prop);

const { names } = props.config;
const value = ref<(Date | string | undefined)[] | null>([]);

if (props.model !== undefined) {
  if (names?.length) {
    const unWatch = watch(
      [() => props.model[names[0]], () => props.model[names[1]]],
      ([start, end], [preStart, preEnd]) => {
        if (!value.value) {
          value.value = [];
        }

        const format = `${props.config.dateFormat || 'YYYY/MM/DD'} ${props.config.timeFormat || 'HH:mm:ss'}`;
        if (!start || !end) value.value = [];
        if (start !== preStart) value.value[0] = datetimeFormatter(start, '', format) as string;
        if (end !== preEnd) value.value[1] = datetimeFormatter(end, '', format) as string;
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
        const format = `${props.config.dateFormat || 'YYYY/MM/DD'} ${props.config.timeFormat || 'HH:mm:ss'}`;

        if (start !== preStart)
          value.value = start.map((item: string) =>
            item ? (datetimeFormatter(item, '', format) as string) : undefined,
          );
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
