<template>
  <MContainer :config="config" :model="values" @change="change"></MContainer>
  <Border :model="values" @change="change"></Border>
</template>

<script lang="ts" setup>
import { type ContainerChangeEventData, MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

import Border from '../components/Border.vue';

defineProps<{ values: Partial<StyleSchema> }>();

const emit = defineEmits<{
  change: [v: StyleSchema, eventData: ContainerChangeEventData];
}>();

const config = {
  items: [
    {
      labelWidth: '68px',
      name: 'borderRadius',
      text: '圆角',
      type: 'data-source-field-select',
      fieldConfig: {
        type: 'text',
      },
    },
  ],
};

const change = (value: StyleSchema, eventData: ContainerChangeEventData) => {
  emit('change', value, eventData);
};
</script>
