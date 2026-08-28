<template>
  <TMagicDatePicker
    :model-value="model[name]"
    popper-class="magic-datetime-picker-popper"
    type="datetime"
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    :format="config.format || 'YYYY/MM/DD HH:mm:ss'"
    :value-format="config.valueFormat || 'YYYY/MM/DD HH:mm:ss'"
    :default-time="config.defaultTime"
    @update:model-value="changeHandler"
  ></TMagicDatePicker>
</template>

<script lang="ts" setup>
import { TMagicDatePicker } from '@tmagic/design';

import type { DateTimeConfig, FieldProps } from '../schema';
import { normalizeDateTimeValue } from '../utils/fieldValueEffects';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDateTime',
});

const props = defineProps<FieldProps<DateTimeConfig>>();

const emit = defineEmits<{
  change: [value: string];
}>();

useAddField(props.prop);

normalizeDateTimeValue(props.config, props.model, props.name);

const changeHandler = (v: string) => {
  emit('change', v);
};
</script>
