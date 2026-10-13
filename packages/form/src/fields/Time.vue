<template>
  <TMagicTimePicker
    :model-value="model[name]"
    :value-format="config.valueFormat || 'HH:mm:ss'"
    :format="config.format || 'HH:mm:ss'"
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    @update:model-value="changeHandler"
  ></TMagicTimePicker>
</template>

<script lang="ts" setup>
import { TMagicTimePicker } from '@tmagic/design';

import type { FieldProps, TimeConfig } from '../schema';
import { normalizeTimestampValue } from '../utils/form';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormTime',
});

const props = defineProps<FieldProps<TimeConfig>>();

const emit = defineEmits<{
  change: [value: string | number | null];
}>();

useAddField(props.prop);

const changeHandler = (v: string | number | null) => {
  emit('change', normalizeTimestampValue(v, props.config.valueFormat));
};
</script>
