<template>
  <TMagicCol v-show="display && config.type !== 'hidden'" :span="span">
    <Container
      :model="model"
      :lastValues="lastValues"
      :is-compare="isCompare"
      :config="config"
      :prop="prop"
      :label-width="config.labelWidth || labelWidth"
      :expand-more="expandMore"
      :size="size"
      :disabled="disabled"
      @change="changeHandler"
      @add-diff-count="onAddDiffCount"
    ></Container>
  </TMagicCol>
</template>

<script setup lang="ts" name="MFormCol">
import { computed, inject } from 'vue';

import { TMagicCol } from '@tmagic/design';

import { ChildConfig, FormState } from '../schema';
import { display as displayFunction } from '../utils/form';

import Container from './Container.vue';

const props = defineProps<{
  model: any;
  lastValues?: any;
  isCompare?: boolean;
  config: ChildConfig;
  labelWidth?: string;
  expandMore?: boolean;
  span?: number;
  size?: string;
  prop?: string;
  disabled?: boolean;
}>();

const emit = defineEmits(['change', 'addDiffCount']);

const mForm = inject<FormState | undefined>('mForm');
const display = computed(() => displayFunction(mForm, props.config.display, props));
const changeHandler = () => emit('change', props.model);
const onAddDiffCount = () => emit('addDiffCount');
</script>
