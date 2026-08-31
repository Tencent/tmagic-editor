<template>
  <span v-if="model">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import type { DisplayConfig, FieldProps, FormState } from '@form/schema';
import { filterFunction } from '@form/utils/form';
import { useAddField } from '@form/utils/useAddField';

defineOptions({
  name: 'MFormDisplay',
});

const props = defineProps<FieldProps<DisplayConfig>>();

const mForm = inject<FormState | undefined>('mForm');

const text = computed(() => {
  if (props.config.displayText) {
    return filterFunction<string>(mForm, props.config.displayText, props);
  }

  return props.model[props.name];
});

useAddField(props.prop);
</script>
