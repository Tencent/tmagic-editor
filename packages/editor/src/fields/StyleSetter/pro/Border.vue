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
  <Border
    :model="values"
    :last-values="lastValues"
    :is-compare="isCompare"
    :size="size"
    :disabled="disabled"
    @change="change"
    @add-diff-count="onAddDiffCount"
  ></Border>
</template>

<script lang="ts" setup>
import { type ContainerChangeEventData, defineFormItem, MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

import Border from '../components/Border.vue';

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
      labelWidth: '68px',
      name: 'borderRadius',
      text: '圆角',
      type: 'data-source-field-select',
      fieldConfig: {
        type: 'text',
      },
    },
  ],
});

const change = (value: StyleSchema, eventData: ContainerChangeEventData) => {
  emit('change', value, eventData);
};

const onAddDiffCount = () => emit('addDiffCount');
</script>
