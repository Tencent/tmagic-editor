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

import type { CascaderOption, FieldProps } from '@tmagic/form';
import type { DataSchema } from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '@tmagic/utils';

import type { DataSourceFieldSelectConfig, Services } from '@editor/type';

const services = inject<Services>('services');
const emit = defineEmits(['change']);

const props = withDefaults(defineProps<FieldProps<DataSourceFieldSelectConfig>>(), {
  disabled: false,
});

const dataSources = computed(() => services?.dataSourceService.get('dataSources'));

const getOptionChildren = (fields: DataSchema[] = []): CascaderOption[] =>
  fields.map((field) => ({
    label: field.title || field.name,
    value: field.name,
    children: field.type === 'array' ? [] : getOptionChildren(field.fields),
  }));

const cascaderConfig = computed(() => {
  const valueIsKey = props.config.value === 'key';

  return {
    type: 'cascader',
    name: props.name,
    checkStrictly: !valueIsKey,
    options: () =>
      dataSources.value
        ?.filter((ds) => ds.fields?.length)
        ?.map((ds) => ({
          label: ds.title || ds.id,
          value: valueIsKey ? ds.id : `${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}${ds.id}`,
          children: getOptionChildren(ds.fields),
        })) || [],
  };
});

const onChangeHandler = (value: any) => {
  emit('change', value);
};
</script>
