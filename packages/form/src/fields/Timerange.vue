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
    @change="changeHandler"
  ></TMagicTimePicker>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

import { TMagicTimePicker } from '@tmagic/design';

import type { DaterangeConfig, FieldProps } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormTimeRange',
});

const props = defineProps<FieldProps<DaterangeConfig>>();

const emit = defineEmits(['change']);

useAddField(props.prop);

// eslint-disable-next-line vue/no-setup-props-destructure
const { names } = props.config;
const value = ref<(Date | undefined)[] | null>([]);

if (props.model !== undefined && names?.length) {
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
  if (names?.length) {
    setValue(value);
  }
  emit('change', value);
};
</script>
