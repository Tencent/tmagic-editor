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

import { type FieldProps, MSelect, type SelectConfig } from '@tmagic/form';

import type { DataSourceSelect, Services } from '../type';

defineOptions({
  name: 'MEditorDataSourceSelect',
});

const emit = defineEmits(['change']);

const props = withDefaults(defineProps<FieldProps<DataSourceSelect>>(), {
  disabled: false,
});

const { dataSourceService } = inject<Services>('services') || {};

const dataSources = computed(() => dataSourceService?.get('dataSources') || []);

const selectConfig = computed<SelectConfig>(() => {
  const { type, dataSourceType, value, ...config } = props.config;

  const valueIsId = props.config.value === 'id';

  return {
    ...config,
    type: 'select',
    valueKey: 'dataSourceId',
    options: dataSources.value
      .filter((ds) => !props.config.dataSourceType || ds.type === props.config.dataSourceType)
      .map((ds) => ({
        value: valueIsId
          ? ds.id
          : {
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
