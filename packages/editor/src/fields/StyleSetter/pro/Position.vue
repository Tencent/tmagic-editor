<template>
  <MContainer :config="config" :model="values" @change="change"></MContainer>
</template>

<script lang="ts" setup>
import { ContainerChangeEventData, MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

const props = defineProps<{ values: Partial<StyleSchema> }>();

const emit = defineEmits<{
  change: [v: string | StyleSchema, eventData: ContainerChangeEventData];
}>();

const positionText: Record<string, string> = {
  static: '不定位',
  relative: '相对定位',
  absolute: '绝对定位',
  fixed: '固定定位',
  sticky: '粘性定位',
};

const config = {
  items: [
    {
      name: 'position',
      text: '定位',
      labelWidth: '68px',
      type: 'data-source-field-select',
      fieldConfig: {
        type: 'select',
        options: Object.keys(positionText).map((item) => ({
          value: item,
          text: `${item}(${positionText[item]})`,
        })),
      },
    },
    {
      type: 'row',
      labelWidth: '68px',
      display: () => props.values.position !== 'static',
      items: [
        {
          name: 'left',
          type: 'data-source-field-select',
          text: 'left',
          fieldConfig: {
            type: 'text',
          },
        },
        {
          name: 'top',
          type: 'data-source-field-select',
          text: 'top',
          fieldConfig: {
            type: 'text',
          },
        },
      ],
    },
    {
      type: 'row',
      labelWidth: '68px',
      display: () => props.values.position !== 'static',
      items: [
        {
          name: 'right',
          type: 'data-source-field-select',
          text: 'right',
          fieldConfig: {
            type: 'text',
          },
        },
        {
          name: 'bottom',
          type: 'data-source-field-select',
          text: 'bottom',
          fieldConfig: {
            type: 'text',
          },
        },
      ],
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
