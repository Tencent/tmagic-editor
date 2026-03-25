<template>
  <div class="m-form-flex-layout" :style="{ display: 'flex', flexWrap: 'wrap', gap }">
    <Container
      v-for="(item, index) in config.items"
      :key="(item as Record<string, any>)[mForm?.keyProp || '__key'] ?? index"
      :config="item"
      :model="name ? model[name] : model"
      :lastValues="name ? lastValues[name] : lastValues"
      :is-compare="isCompare"
      :prop="prop"
      :size="size"
      :disabled="disabled"
      :label-width="config.labelWidth || labelWidth"
      @change="changeHandler"
      @addDiffCount="onAddDiffCount()"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import type { FlexLayoutConfig } from '@tmagic/form-schema';

import type { ContainerChangeEventData, FormState } from '../schema';

import Container from './Container.vue';

defineOptions({
  name: 'MFormFlexLayout',
});

const props = defineProps<{
  model: any;
  lastValues?: any;
  isCompare?: boolean;
  config: FlexLayoutConfig;
  name?: string;
  labelWidth?: string;
  prop?: string;
  size?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [v: any, eventData: ContainerChangeEventData];
  addDiffCount: [];
}>();

const mForm = inject<FormState | undefined>('mForm');

const gap = computed(() => props.config.gap || '16px');

const changeHandler = (v: any, eventData: ContainerChangeEventData) => {
  emit('change', props.model, eventData);
};

const onAddDiffCount = () => emit('addDiffCount');
</script>
