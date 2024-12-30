<template>
  <MContainer :config="config" :model="values" @change="change"></MContainer>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue';

import { ContainerChangeEventData, MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

import { AlignCenter, AlignLeft, AlignRight } from '../icons/text-align';

defineProps<{ values: Partial<StyleSchema> }>();

const emit = defineEmits<{
  change: [v: StyleSchema, eventData: ContainerChangeEventData];
}>();

const config = {
  items: [
    {
      type: 'row',
      items: [
        {
          labelWidth: '68px',
          name: 'fontSize',
          text: '字号',
          type: 'data-source-field-select',
          fieldConfig: {
            type: 'text',
          },
        },
        {
          labelWidth: '68px',
          name: 'lineHeight',
          text: '行高',
          type: 'data-source-field-select',
          fieldConfig: {
            type: 'text',
          },
        },
      ],
    },
    {
      name: 'fontWeight',
      text: '字重',
      labelWidth: '68px',
      type: 'data-source-field-select',
      fieldConfig: {
        type: 'select',
        options: ['normal', 'bold']
          .concat(
            Array(7)
              .fill(1)
              .map((x, i) => `${i + 1}00`),
          )
          .map((item) => ({
            value: item,
            text: item,
          })),
      },
    },
    {
      labelWidth: '68px',
      name: 'color',
      text: '颜色',
      type: 'data-source-field-select',
      fieldConfig: {
        type: 'colorPicker',
      },
    },
    {
      name: 'textAlign',
      text: '对齐',
      type: 'radioGroup',
      childType: 'button',
      labelWidth: '68px',
      options: [
        { value: 'left', icon: markRaw(AlignLeft), tooltip: '左对齐 row' },
        { value: 'center', icon: markRaw(AlignCenter), tooltip: '居中对齐 center' },
        { value: 'right', icon: markRaw(AlignRight), tooltip: '右对齐 right' },
      ],
    },
  ],
};

const change = (value: StyleSchema, eventData: ContainerChangeEventData) => {
  emit('change', value, eventData);
};
</script>
