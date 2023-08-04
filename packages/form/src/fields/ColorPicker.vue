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

import type { ColorPickConfig, FieldProps } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormColorPicker',
});

const props = defineProps<FieldProps<ColorPickConfig>>();

const emit = defineEmits<{
  change: [value: string];
}>();

useAddField(props.prop);

const changeHandler = (value: string) => emit('change', value);
</script>
