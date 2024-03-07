<template>
  <MCascader
    :config="cascaderConfig"
    :model="model"
    :name="name"
    :disabled="disabled"
    :size="size"
    :last-values="lastValues"
    :init-values="initValues"
    :values="values"
    :prop="`${prop}${prop ? '.' : ''}${name}`"
    @change="onChangeHandler"
  ></MCascader>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import type { CascaderConfig, CascaderOption, FieldProps } from '@tmagic/form';
import { MCascader } from '@tmagic/form';
import type { DataSchema, DataSourceFieldType } from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '@tmagic/utils';

import type { DataSourceFieldSelectConfig, Services } from '@editor/type';

defineOptions({
  name: 'MEditorDataSourceFieldSelect',
});

const services = inject<Services>('services');
const emit = defineEmits(['change']);

const props = withDefaults(defineProps<FieldProps<DataSourceFieldSelectConfig>>(), {
  disabled: false,
});

const dataSources = computed(() => services?.dataSourceService.get('dataSources'));

const getOptionChildren = (fields: DataSchema[] = [], fieldType: DataSourceFieldType[] = []): CascaderOption[] =>
  fields
    .filter((field) => !fieldType.length || fieldType.includes(field.type || 'string') || field.type === 'object')
    .map((field) => ({
      label: field.title || field.name,
      value: field.name,
      children: field.type === 'array' ? [] : getOptionChildren(field.fields, fieldType),
    }));

const cascaderConfig = computed<CascaderConfig>(() => {
  const valueIsKey = props.config.value === 'key';

  return {
    type: 'cascader',
    checkStrictly: props.config.checkStrictly ?? !valueIsKey,
    popperClass: 'm-editor-data-source-field-select-popper',
    options: () => {
      const options =
        dataSources.value?.map((ds) => ({
          label: ds.title || ds.id,
          value: valueIsKey ? ds.id : `${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}${ds.id}`,
          children: getOptionChildren(ds.fields, props.config.fieldType),
        })) || [];
      return options.filter((option) => option.children.length);
    },
  };
});

const onChangeHandler = (value: any) => {
  emit('change', value);
};
</script>
