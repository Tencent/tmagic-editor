<template>
  <TMagicDatePicker
    v-model="model[name]"
    type="date"
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    :format="config.format"
    :value-format="config.valueFormat || 'YYYY-MM-DD HH:mm:ss'"
    @change="changeHandler"
  ></TMagicDatePicker>
</template>

<script lang="ts" setup>
import { TMagicDatePicker } from '@tmagic/design';
import { datetimeFormatter } from '@tmagic/utils';

import { DateConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDate',
});

const props = defineProps<{
  config: DateConfig;
  model: any;
  initValues?: any;
  values?: any;
  name: string;
  prop: string;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
  lastValues?: Record<string, any>;
}>();

const emit = defineEmits(['change']);

useAddField(props.prop);

props.model[props.name] = datetimeFormatter(props.model[props.name], '');

const changeHandler = (v: string) => {
  emit('change', v);
};
</script>
