<template>
  <span v-if="model">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import type { DisplayConfig, FieldProps, FormState } from '../schema';
import { applyDisplayInitValue } from '../utils/fieldValueEffects';
import { filterFunction } from '../utils/form';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDisplay',
});

const props = defineProps<FieldProps<DisplayConfig>>();

const mForm = inject<FormState | undefined>('mForm');

applyDisplayInitValue(props.config, props.model, props.name);

const text = computed(() => {
  if (props.config.displayText) {
    return filterFunction<string>(mForm, props.config.displayText, props);
  }

  return props.model[props.name];
});

useAddField(props.prop);
</script>
