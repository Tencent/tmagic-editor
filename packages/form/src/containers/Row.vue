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
      :prop="prop"
      :size="size"
      :disabled="disabled"
      @change="changeHandler"
    />
  </TMagicRow>
</template>

<script setup lang="ts" name="MFormRow">
import { inject } from 'vue';

import { TMagicRow } from '@tmagic/design';

import { FormState, RowConfig } from '../schema';

import Col from './Col.vue';

const props = defineProps<{
  model: any;
  config: RowConfig;
  name: string;
  labelWidth?: string;
  prop?: string;
  size?: string;
  expandMore?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits(['change']);

const mForm = inject<FormState | undefined>('mForm');

const changeHandler = () => emit('change', props.name ? props.model[props.name] : props.model);
</script>
