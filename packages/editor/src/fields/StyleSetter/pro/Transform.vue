<template>
  <MContainer
    :config="config"
    :model="values"
    :last-values="lastValues"
    :is-compare="isCompare"
    :size="size"
    :disabled="disabled"
    @change="change"
    @add-diff-count="onAddDiffCount"
  ></MContainer>
</template>

<script lang="ts" setup>
import { type ContainerChangeEventData, defineFormItem, MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

defineProps<{
  values: Partial<StyleSchema>;
  lastValues?: Partial<StyleSchema>;
  isCompare?: boolean;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
}>();

const emit = defineEmits<{
  change: [v: StyleSchema, eventData: ContainerChangeEventData];
  addDiffCount: [];
}>();

const config = defineFormItem({
  items: [
    {
      name: 'transform',
      items: [
        {
          name: 'rotate',
          text: '旋转角度',
          labelWidth: '68px',
          type: 'data-source-field-select',
          checkStrictly: false,
          dataSourceFieldType: ['string', 'number'],
          fieldConfig: {
            type: 'text',
          },
        },
        {
          name: 'scale',
          text: '缩放',
          labelWidth: '68px',
          type: 'data-source-field-select',
          checkStrictly: false,
          dataSourceFieldType: ['string', 'number'],
          fieldConfig: {
            type: 'text',
          },
        },
      ],
    },
  ],
});

const change = (value: StyleSchema, eventData: ContainerChangeEventData) => {
  emit('change', value, eventData);
};

const onAddDiffCount = () => emit('addDiffCount');
</script>
