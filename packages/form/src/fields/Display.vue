<template>
  <span v-if="model">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import type { DisplayConfig, FieldProps, FormState } from '../schema';
import { filterFunction } from '../utils/form';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDisplay',
});

const props = defineProps<FieldProps<DisplayConfig>>();

const mForm = inject<FormState | undefined>('mForm');

if (props.config.initValue && props.model) {
  props.model[props.name] = props.config.initValue;
}

const text = computed(() => {
  if (props.config.displayText) {
    return filterFunction<string>(mForm, props.config.displayText, props);
  }

  return props.model[props.name];
});

useAddField(props.prop);
</script>
