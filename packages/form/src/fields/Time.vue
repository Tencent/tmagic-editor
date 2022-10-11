<template>
  <TMagicTimePicker
    v-model="model[name]"
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    @change="changeHandler"
  ></TMagicTimePicker>
</template>

<script lang="ts" setup>
import { TMagicTimePicker } from '@tmagic/design';

import { TimeConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

const props = defineProps<{
  config: TimeConfig;
  model: any;
  initValues?: any;
  values?: any;
  name: string;
  prop: string;
  disabled?: boolean;
  size: 'mini' | 'small' | 'medium';
}>();

const emit = defineEmits(['change']);

useAddField(props.prop);

const changeHandler = (v: string) => {
  emit('change', v);
};
</script>
