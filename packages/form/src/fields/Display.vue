<template>
  <span v-if="model">{{ model[name] }}</span>
</template>

<script setup lang="ts">
import type { DisplayConfig, FieldProps } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDisplay',
});

const props = defineProps<FieldProps<DisplayConfig>>();

if (props.config.initValue && props.model) {
  // eslint-disable-next-line vue/no-setup-props-destructure
  props.model[props.name] = props.config.initValue;
}

useAddField(props.prop);
</script>
