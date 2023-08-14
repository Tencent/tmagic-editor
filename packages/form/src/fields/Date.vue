<template>
  <TMagicDatePicker
    v-model="model[name]"
    type="date"
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    :format="config.format"
    :value-format="config.valueFormat || 'YYYY/MM/DD HH:mm:ss'"
    @change="changeHandler"
  ></TMagicDatePicker>
</template>

<script lang="ts" setup>
import { TMagicDatePicker } from '@tmagic/design';
import { datetimeFormatter } from '@tmagic/utils';

import type { DateConfig, FieldProps } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDate',
});

const props = defineProps<FieldProps<DateConfig>>();

const emit = defineEmits<{
  change: [value: string];
}>();

useAddField(props.prop);

props.model[props.name] = datetimeFormatter(props.model[props.name], '');

const changeHandler = (v: string) => {
  emit('change', v);
};
</script>
