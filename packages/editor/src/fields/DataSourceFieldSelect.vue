<template>
  <div style="width: 100%; display: flex; align-items: center">
    <component
      style="width: 100%"
      :is="tagName"
      :config="showDataSourceFieldSelect || !config.fieldConfig ? cascaderConfig : config.fieldConfig"
      :model="model"
      :name="name"
      :disabled="disabled"
      :size="size"
      :last-values="lastValues"
      :init-values="initValues"
      :values="values"
      :prop="`${prop}${prop ? '.' : ''}${name}`"
      @change="onChangeHandler"
    ></component>
    <TMagicButton
      v-if="(showDataSourceFieldSelect || !config.fieldConfig) && selectedDataSourceId"
      style="margin-left: 5px"
      :size="size"
      @click="editHandler(selectedDataSourceId)"
      ><MIcon :icon="Edit"></MIcon
    ></TMagicButton>
    <TMagicButton
      v-if="config.fieldConfig"
      style="margin-left: 5px"
      :type="showDataSourceFieldSelect ? 'primary' : 'default'"
      :size="size"
      @click="showDataSourceFieldSelect = !showDataSourceFieldSelect"
      ><MIcon :icon="Coin"></MIcon
    ></TMagicButton>

    <DataSourceConfigPanel
      ref="editDialog"
      :disabled="!editable"
      :values="dataSourceValues"
      :title="dialogTitle"
      @submit="submitDataSourceHandler"
    ></DataSourceConfigPanel>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, resolveComponent, watch } from 'vue';
import { Coin, Edit } from '@element-plus/icons-vue';

import { TMagicButton } from '@tmagic/design';
import type { CascaderConfig, CascaderOption, FieldProps, FormState } from '@tmagic/form';
import { MCascader } from '@tmagic/form';
import type { DataSchema, DataSourceFieldType } from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '@tmagic/utils';

import MIcon from '@editor/components/Icon.vue';
import { useDataSourceEdit } from '@editor/hooks/use-data-source-edit';
import DataSourceConfigPanel from '@editor/layouts/sidebar/data-source/DataSourceConfigPanel.vue';
import type { DataSourceFieldSelectConfig, Services } from '@editor/type';

defineOptions({
  name: 'MFieldsDataSourceFieldSelect',
});

const services = inject<Services>('services');
const emit = defineEmits(['change']);

const props = withDefaults(defineProps<FieldProps<DataSourceFieldSelectConfig>>(), {
  disabled: false,
});

const selectedDataSourceId = computed(() => {
  const value = props.model[props.name];
  if (!Array.isArray(value) || !value.length) {
    return '';
  }

  return value[0].replace(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX, '');
});

const dataSources = computed(() => services?.dataSourceService.get('dataSources'));

const getOptionChildren = (
  fields: DataSchema[] = [],
  dataSourceFieldType: DataSourceFieldType[] = ['any'],
): CascaderOption[] => {
  const child: CascaderOption[] = [];
  fields.forEach((field) => {
    if (!dataSourceFieldType.length) {
      dataSourceFieldType.push('any');
    }

    const children = getOptionChildren(field.fields, dataSourceFieldType);

    const item = {
      label: field.title || field.name,
      value: field.name,
      children,
    };

    const fieldType = field.type || 'any';
    if (dataSourceFieldType.includes('any') || dataSourceFieldType.includes(fieldType)) {
      child.push(item);
      return;
    }

    if (!dataSourceFieldType.includes(fieldType) && !['array', 'object', 'any'].includes(fieldType)) {
      return;
    }

    if (!children.length && ['object', 'array', 'any'].includes(field.type || '')) {
      return;
    }

    child.push(item);
  });
  return child;
};

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
          children: getOptionChildren(ds.fields, props.config.dataSourceFieldType),
        })) || [];
      return options.filter((option) => option.children.length);
    },
  };
});

const showDataSourceFieldSelect = ref(false);

watch(
  () => props.model[props.name],
  (value) => {
    if (
      Array.isArray(value) &&
      typeof value[0] === 'string' &&
      value[0].startsWith(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX)
    ) {
      showDataSourceFieldSelect.value = true;
    } else {
      showDataSourceFieldSelect.value = false;
    }
  },
  {
    immediate: true,
  },
);

const mForm = inject<FormState | undefined>('mForm');

const type = computed((): string => {
  let type = props.config.fieldConfig?.type;
  if (typeof type === 'function') {
    type = type(mForm, {
      model: props.model,
    });
  }
  if (type === 'form') return '';
  if (type === 'container') return '';
  return type?.replace(/([A-Z])/g, '-$1').toLowerCase() || (props.config.items ? '' : 'text');
});

const tagName = computed(() => {
  if (showDataSourceFieldSelect.value || !props.config.fieldConfig) {
    return MCascader;
  }

  const component = resolveComponent(`m-${props.config.items ? 'form' : 'fields'}-${type.value}`);
  if (typeof component !== 'string') return component;
  return 'm-fields-text';
});

const onChangeHandler = (value: any) => {
  emit('change', value);
};

const { editDialog, dataSourceValues, dialogTitle, editable, editHandler, submitDataSourceHandler } = useDataSourceEdit(
  services?.dataSourceService,
);
</script>
