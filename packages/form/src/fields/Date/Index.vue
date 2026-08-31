<template>
  <TMagicDatePicker
    :model-value="model[name]"
    type="date"
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    :format="config.format || 'YYYY/MM/DD'"
    :value-format="config.valueFormat || 'YYYY/MM/DD'"
    @update:model-value="changeHandler"
  ></TMagicDatePicker>
</template>

<script lang="ts" setup>
import { TMagicDatePicker } from '@tmagic/design';

import type { DateConfig, FieldProps } from '@form/schema';
import { useAddField } from '@form/utils/useAddField';

defineOptions({
  name: 'MFormDate',
});

const props = defineProps<FieldProps<DateConfig>>();

const emit = defineEmits<{
  change: [value: string];
}>();

useAddField(props.prop);

const changeHandler = (v: string) => {
  emit('change', v);
};
</script>
