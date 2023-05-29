<template>
  <TMagicColorPicker
    v-model="model[name]"
    :size="size"
    :disabled="disabled"
    :showAlpha="true"
    @change="changeHandler"
  ></TMagicColorPicker>
</template>

<script lang="ts" setup>
import { TMagicColorPicker } from '@tmagic/design';

import { ColorPickConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormColorPicker',
});

const props = defineProps<{
  config: ColorPickConfig;
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

const changeHandler = (value: string) => emit('change', value);
</script>
