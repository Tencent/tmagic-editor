<template>
  <TMagicTimePicker
    v-model="model[name]"
    :value-format="config.valueFormat || 'HH:mm:ss'"
    :format="config.format || 'HH:mm:ss'"
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    @change="changeHandler"
  ></TMagicTimePicker>
</template>

<script lang="ts" setup>
import { TMagicTimePicker } from '@tmagic/design';

import type { FieldProps, TimeConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormTime',
});

const props = defineProps<FieldProps<TimeConfig>>();

const emit = defineEmits<{
  change: [value: string];
}>();

useAddField(props.prop);

const changeHandler = (v: string) => {
  emit('change', v);
};
</script>
