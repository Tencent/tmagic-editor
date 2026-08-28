<template>
  <MContainer
    v-for="(item, index) in formConfig"
    :prop="prop"
    :key="index"
    :config="item"
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
import { computed } from 'vue';

import { type ContainerChangeEventData, MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

import { createPositionConfig } from '../configs';

const props = defineProps<{
  values: Partial<StyleSchema>;
  lastValues?: Partial<StyleSchema>;
  isCompare?: boolean;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
  prop?: string;
}>();

const emit = defineEmits<{
  change: [v: string | StyleSchema, eventData: ContainerChangeEventData];
  addDiffCount: [];
}>();

const formConfig = computed(() => createPositionConfig(props.values));

const change = (value: string | StyleSchema, eventData: ContainerChangeEventData) => {
  emit('change', value, eventData);
};

const onAddDiffCount = () => emit('addDiffCount');
</script>
