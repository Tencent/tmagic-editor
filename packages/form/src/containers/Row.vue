<template>
  <TMagicRow :gutter="10">
    <Col
      v-for="(col, index) in config.items"
      :key="col[mForm?.keyProp || '__key'] ?? index"
      :span="col.span || config.span || 24 / config.items.length"
      :config="col"
      :labelWidth="config.labelWidth || labelWidth"
      :expandMore="expandMore"
      :model="name ? model[name] : model"
      :lastValues="name ? lastValues[name] : lastValues"
      :is-compare="isCompare"
      :prop="prop"
      :size="size"
      :disabled="disabled"
      @change="changeHandler"
      @add-diff-count="onAddDiffCount"
    />
  </TMagicRow>
</template>

<script setup lang="ts">
import { inject } from 'vue';

import { TMagicRow } from '@tmagic/design';

import type { ContainerChangeEventData, FormState, RowConfig } from '../schema';

import Col from './Col.vue';

defineOptions({
  name: 'MFormRow',
});

const props = defineProps<{
  model: any;
  lastValues?: any;
  isCompare?: boolean;
  config: RowConfig;
  name: string;
  labelWidth?: string;
  prop?: string;
  size?: string;
  expandMore?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [v: any, eventData: ContainerChangeEventData];
  addDiffCount: [];
}>();

const mForm = inject<FormState | undefined>('mForm');

const changeHandler = (v: any, eventData: ContainerChangeEventData) => {
  emit('change', props.name ? props.model[props.name] : props.model, eventData);
};
const onAddDiffCount = () => emit('addDiffCount');
</script>
