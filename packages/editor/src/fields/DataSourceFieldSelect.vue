<template>
  <m-form-container
    :config="{
      ...config,
      ...cascaderConfig,
    }"
    :model="model"
    @change="onChangeHandler"
  ></m-form-container>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import { DataSourceFieldSelectConfig, Services } from '@editor/type';

const services = inject<Services>('services');
const emit = defineEmits(['change']);

const props = withDefaults(
  defineProps<{
    config: DataSourceFieldSelectConfig;
    model: any;
    lastValues?: any;
    prop: string;
    name: string;
    disabled?: boolean;
    size: 'small' | 'default' | 'large';
  }>(),
  {
    disabled: false,
  },
);

const dataSources = computed(() => services?.dataSourceService.get('dataSources'));

const cascaderConfig = {
  type: 'cascader',
  name: props.name,
  options: () =>
    dataSources.value
      ?.filter((ds) => ds.fields?.length)
      ?.map((ds) => ({
        label: ds.title || ds.id,
        value: ds.id,
        children: ds.fields?.map((field) => ({
          label: field.title,
          value: field.name,
        })),
      })) || [],
};

const onChangeHandler = (value: any) => {
  emit('change', value);
};
</script>
