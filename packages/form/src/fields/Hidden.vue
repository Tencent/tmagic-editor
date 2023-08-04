<template>
  <input v-if="model" v-model="model[name]" type="hidden" />
</template>

<script setup lang="ts">
import type { FieldProps, HiddenConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormHidden',
});

const props = defineProps<FieldProps<HiddenConfig>>();

useAddField(props.prop);
</script>
