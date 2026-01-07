<template>
  <MGroupList
    style="width: 100%"
    :config="config"
    :name="name"
    :disabled="disabled"
    :model="model"
    :last-values="lastValues"
    :prop="prop"
    :size="size"
    @change="changeHandler"
  ></MGroupList>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';

import type { DisplayCond } from '@tmagic/core';
import {
  type ContainerChangeEventData,
  type DisplayCondsConfig,
  type FieldProps,
  filterFunction,
  type FormState,
  type GroupListConfig,
  MGroupList,
} from '@tmagic/form';

import { useServices } from '@editor/hooks/use-services';
import { getCascaderOptionsFromFields, getFieldType } from '@editor/utils';

defineOptions({
  name: 'm-fields-display-conds',
});

const emit = defineEmits<{
  change: [value: DisplayCond[], eventData?: ContainerChangeEventData];
}>();

const props = withDefaults(defineProps<FieldProps<DisplayCondsConfig>>(), {
  disabled: false,
});

const { dataSourceService } = useServices();
const mForm = inject<FormState | undefined>('mForm');

const parentFields = computed(() => filterFunction<string[]>(mForm, props.config.parentFields, props) || []);

const fieldOnChange = (_formState: FormState | undefined, v: string[], { model }: { model: Record<string, any> }) => {
  const [id, ...fieldNames] = [...parentFields.value, ...v];
  const ds = dataSourceService.getDataSourceById(id);
  const type = getFieldType(ds, fieldNames);
  if (type === 'number') {
    model.value = Number(model.value);
  } else if (type === 'boolean') {
    model.value = Boolean(model.value);
  } else if (type === 'null') {
    model.value = null;
  } else {
    model.value = `${model.value}`;
  }
  return v;
};

const config = computed<GroupListConfig>(() => ({
  type: 'groupList',
  name: props.name,
  titlePrefix: props.config.titlePrefix,
  expandAll: true,
  items: [
    {
      type: 'table',
      name: 'cond',
      operateColWidth: 80,
      enableToggleMode: false,
      items: [
        parentFields.value.length
          ? {
              type: 'cascader',
              options: () => {
                const [dsId, ...keys] = parentFields.value;
                const ds = dataSourceService.getDataSourceById(dsId);
                if (!ds) {
                  return [];
                }

                let fields = ds.fields || [];
                keys.forEach((key) => {
                  const field = fields.find((f) => f.name === key);
                  fields = field?.fields || [];
                });

                return getCascaderOptionsFromFields(fields, ['string', 'number', 'boolean', 'any']);
              },
              name: 'field',
              value: 'key',
              label: '字段',
              checkStrictly: false,
              onChange: fieldOnChange,
            }
          : {
              type: 'data-source-field-select',
              name: 'field',
              value: 'key',
              label: '字段',
              checkStrictly: false,
              dataSourceFieldType: ['string', 'number', 'boolean', 'any'],
              onChange: fieldOnChange,
            },
        {
          type: 'cond-op-select',
          parentFields: parentFields.value,
          label: '条件',
          width: 140,
          name: 'op',
        },
        {
          label: '值',
          width: 160,
          items: [
            {
              name: 'value',
              type: (_mForm, { model }) => {
                const [id, ...fieldNames] = [...parentFields.value, ...model.field];
                const ds = dataSourceService.getDataSourceById(id);
                const type = getFieldType(ds, fieldNames);

                if (type === 'number') {
                  return 'number';
                }

                if (type === 'boolean') {
                  return 'select';
                }

                if (type === 'null') {
                  return 'display';
                }

                return 'text';
              },
              options: [
                { text: 'true', value: true },
                { text: 'false', value: false },
              ],
              display: (_mForm, { model }) => !['between', 'not_between'].includes(model.op),
              displayText: (_mForm: FormState | undefined, { model }: any) => {
                if (model.value === null) {
                  return 'null';
                }
                return model.value;
              },
            },
            {
              name: 'range',
              type: 'number-range',
              display: (vm, { model }) => ['between', 'not_between'].includes(model.op),
            },
          ],
        },
      ],
    },
  ],
}));

const changeHandler = (v: DisplayCond[], eventData?: ContainerChangeEventData) => {
  if (!Array.isArray(props.model[props.name])) {
    props.model[props.name] = [];
  }

  emit('change', v, eventData);
};
</script>
