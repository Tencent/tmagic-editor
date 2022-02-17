<template>
  <input v-if="model" v-model="model[n]" type="hidden" />
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

import { HiddenConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-hidden',
});
</script>

<script setup lang="ts">
const props = defineProps({
  ...fieldProps,
  config: {
    type: Object as PropType<HiddenConfig>,
    required: true,
  },
});

const n = computed(() => props.name || props.config.name || '');

useAddField(props.prop);
</script>
