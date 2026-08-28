<template>
  <MContainer
    v-for="item in formConfig"
    :prop="prop"
    :key="item.name"
    :config="item"
    :model="values"
    :last-values="lastValues"
    :is-compare="isCompare"
    :size="size"
    :disabled="disabled"
    @change="change"
    @add-diff-count="onAddDiffCount"
  ></MContainer>
  <Box
    v-show="!['fixed', 'absolute'].includes(values.position)"
    :model="values"
    :last-values="lastValues"
    :is-compare="isCompare"
    :size="size"
    :disabled="disabled"
    @change="change"
  ></Box>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { useTheme } from '@tmagic/design';
import type { ContainerChangeEventData } from '@tmagic/form';
import { MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

import Box from '../components/Box.vue';
import { createLayoutConfig } from '../configs';

const props = defineProps<{
  values: Partial<StyleSchema>;
  lastValues?: Partial<StyleSchema>;
  isCompare?: boolean;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
  theme?: string;
  prop?: string;
}>();

const emit = defineEmits<{
  change: [v: string | StyleSchema, eventData: ContainerChangeEventData];
  addDiffCount: [];
}>();

const displayTheme = useTheme(props);

const formConfig = computed(() => createLayoutConfig(displayTheme.value));

const change = (value: string | StyleSchema, eventData: ContainerChangeEventData) => {
  emit('change', value, eventData);
};

const onAddDiffCount = () => emit('addDiffCount');
</script>
