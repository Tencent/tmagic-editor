<template>
  <MContainer :config="config" :model="values" @change="change"></MContainer>
  <Position v-show="values['position'] !== 'static'" :model="values" @change="change"></Position>
</template>

<script lang="ts" setup>
import { ContainerChangeEventData, MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

import Position from '../components/Position.vue';

defineProps<{ values: Partial<StyleSchema> }>();

const emit = defineEmits<{
  change: [v: string | StyleSchema, eventData: ContainerChangeEventData];
}>();

const config = {
  items: [
    {
      name: 'position',
      text: '定位',
      labelWidth: '68px',
      type: 'data-source-field-select',
      fieldConfig: {
        type: 'select',
        options: ['static', 'relative', 'absolute', 'fixed', 'sticky'].map((item) => ({
          value: item,
          text: item,
        })),
      },
    },
    {
      labelWidth: '68px',
      name: 'zIndex',
      text: 'zIndex',
      type: 'data-source-field-select',
      fieldConfig: {
        type: 'text',
      },
    },
  ],
};

const change = (value: string | StyleSchema, eventData: ContainerChangeEventData) => {
  emit('change', value, eventData);
};
</script>
