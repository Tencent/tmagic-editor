<template>
  <span v-if="model">{{ model[n] }}</span>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

import { DisplayConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-display',
});
</script>

<script setup lang="ts">
const props = defineProps({
  ...fieldProps,
  config: {
    type: Object as PropType<DisplayConfig>,
    required: true,
  },
});

const n = computed(() => props.name || props.config.name || '');

if (props.config.initValue && n.value && props.model) {
  // eslint-disable-next-line no-param-reassign,vue/no-setup-props-destructure
  props.model[n.value] = props.config.initValue;
}

useAddField(props.prop);
</script>
