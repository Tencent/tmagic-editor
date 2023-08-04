<template>
  <MSelect
    :model="model"
    :name="name"
    :size="size"
    :prop="prop"
    :disabled="disabled"
    :config="selectConfig"
    :last-values="lastValues"
    @change="changeHandler"
  ></MSelect>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import { FieldProps, MSelect, SelectConfig } from '@tmagic/form';

import { Services } from '../type';

defineOptions({
  name: 'MEditorDataSourceSelect',
});

const emit = defineEmits(['change']);

const props = withDefaults(
  defineProps<
    FieldProps<{
      type: 'data-source-select';
      name: string;
      text: string;
      placeholder: string;
      dataSourceType?: string;
    }>
  >(),
  {
    disabled: false,
  },
);

const { dataSourceService } = inject<Services>('services') || {};

const dataSources = computed(() => dataSourceService?.get('dataSources') || []);

const selectConfig = computed<SelectConfig>(() => {
  const { type, dataSourceType, ...config } = props.config;
  return {
    ...config,
    type: 'select',
    valueKey: 'dataSourceId',
    options: dataSources.value
      .filter((ds) => !dataSourceType || ds.type === dataSourceType)
      .map((ds) => ({
        value: {
          isBindDataSource: true,
          dataSourceType: ds.type,
          dataSourceId: ds.id,
        },
        text: ds.title || ds.id,
      })),
  };
});

const changeHandler = (value: any) => {
  emit('change', value);
};
</script>
