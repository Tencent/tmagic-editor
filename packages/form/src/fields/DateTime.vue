<template>
  <TMagicDatePicker
    v-model="model[name]"
    popper-class="magic-datetime-picker-popper"
    type="datetime"
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    :format="config.format || 'YYYY/MM/DD HH:mm:ss'"
    :value-format="config.valueFormat || 'YYYY/MM/DD HH:mm:ss'"
    :default-time="config.defaultTime"
    @change="changeHandler"
  ></TMagicDatePicker>
</template>

<script lang="ts" setup>
import { TMagicDatePicker } from '@tmagic/design';
import { datetimeFormatter } from '@tmagic/utils';

import type { DateTimeConfig, FieldProps } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDateTime',
});

const props = defineProps<FieldProps<DateTimeConfig>>();

const emit = defineEmits<{
  change: [value: string];
}>();

useAddField(props.prop);

const value = props.model?.[props.name].toString();
if (props.model) {
  if (value === 'Invalid Date') {
    props.model[props.name] = '';
  } else {
    props.model[props.name] = datetimeFormatter(props.model[props.name], '', props.config.valueFormat);
  }
}

const changeHandler = (v: string) => {
  emit('change', v);
};
</script>
