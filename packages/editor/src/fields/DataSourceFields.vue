<template>
  <div class="m-editor-data-source-fields">
    <MagicTable :data="model[name]" :columns="fieldColumns"></MagicTable>

    <div class="m-editor-data-source-fields-footer">
      <TMagicButton size="small" :disabled="disabled" plain @click="newFromJsonHandler()">快速添加</TMagicButton>
      <TMagicButton size="small" type="primary" :disabled="disabled" plain @click="newHandler()">添加</TMagicButton>
    </div>

    <MFormDrawer
      ref="addDialog"
      label-width="80px"
      :title="fieldTitle"
      :config="dataSourceFieldsConfig"
      :values="fieldValues"
      :parentValues="model[name]"
      :disabled="disabled"
      :width="width"
      @submit="fieldChange"
    ></MFormDrawer>

    <MFormDrawer
      ref="addFromJsonDialog"
      title="快速添加数据定义"
      :config="jsonFromConfig"
      :values="jsonFromValues"
      :disabled="disabled"
      :width="width"
      @submit="addFromJsonFromChange"
    ></MFormDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';

import { TMagicButton, tMagicMessage, tMagicMessageBox } from '@tmagic/design';
import { type FieldProps, type FormConfig, type FormState, MFormDrawer } from '@tmagic/form';
import type { DataSchema } from '@tmagic/schema';
import { type ColumnConfig, MagicTable } from '@tmagic/table';
import { getDefaultValueFromFields } from '@tmagic/utils';

import type { Services } from '@editor/type';

defineOptions({
  name: 'MEditorDataSourceFields',
});

const props = withDefaults(
  defineProps<
    FieldProps<{
      type: 'data-source-fields';
    }>
  >(),
  {
    disabled: false,
  },
);

const emit = defineEmits(['change']);

const services = inject<Services>('services');

const addDialog = ref<InstanceType<typeof MFormDrawer>>();

const fieldValues = ref<Record<string, any>>({});
const fieldTitle = ref('');

const width = computed(() => globalThis.document.body.clientWidth - (services?.uiService.get('columnWidth').left || 0));

const newHandler = () => {
  fieldValues.value = {};
  fieldTitle.value = '新增属性';
  addDialog.value?.show();
};

const fieldChange = ({ index, ...value }: Record<string, any>) => {
  if (index > -1) {
    props.model[props.name][index] = value;
  } else {
    props.model[props.name].push(value);
  }

  addDialog.value?.hide();

  emit('change', props.model[props.name]);
};

const fieldColumns: ColumnConfig[] = [
  {
    label: '属性名称',
    prop: 'title',
  },
  {
    label: '属性key',
    prop: 'name',
  },
  {
    label: '属性描述',
    prop: 'description',
  },
  {
    label: '默认值',
    prop: 'defaultValue',
    formatter(item, row) {
      try {
        return JSON.stringify(row.defaultValue);
      } catch (e) {
        return row.defaultValue;
      }
    },
  },
  {
    label: '操作',
    fixed: 'right',
    actions: [
      {
        text: '编辑',
        handler: (row: Record<string, any>, index: number) => {
          fieldValues.value = {
            ...row,
            index,
          };
          fieldTitle.value = `编辑${row.title}`;
          addDialog.value?.show();
        },
      },
      {
        text: '删除',
        buttonType: 'danger',
        handler: async (row: Record<string, any>, index: number) => {
          await tMagicMessageBox.confirm(`确定删除${row.title}(${row.name})?`, '提示');
          props.model[props.name].splice(index, 1);
          emit('change', props.model[props.name]);
        },
      },
    ],
  },
];

const dataSourceFieldsConfig: FormConfig = [
  { name: 'index', type: 'hidden', filter: 'number', defaultValue: -1 },
  {
    name: 'type',
    text: '数据类型',
    type: 'select',
    defaultValue: 'string',
    options: [
      { text: '字符串', value: 'string' },
      { text: '数字', value: 'number' },
      { text: '布尔值', value: 'boolean' },
      { text: '对象', value: 'object' },
      { text: '数组', value: 'array' },
      { text: 'null', value: 'null' },
      { text: 'any', value: 'any' },
    ],
  },
  {
    name: 'name',
    text: '字段名称',
    rules: [
      {
        required: true,
        message: '请输入字段名称',
      },
      {
        validator: ({ value, callback }, { model, parent }) => {
          const index = parent.findIndex((item: Record<string, any>) => item.name === value);
          if ((model.index === -1 && index > -1) || (model.index > -1 && index > -1 && index !== model.index)) {
            return callback(`属性key（${value}）已存在`);
          }
          callback();
        },
      },
    ],
  },
  {
    name: 'title',
    text: '展示名称',
    rules: [
      {
        required: true,
        message: '请输入展示名称',
      },
    ],
  },
  {
    name: 'description',
    text: '描述',
    type: 'textarea',
  },
  {
    name: 'defaultValue',
    text: '默认值',
    height: '200px',
    parse: true,
    type: (mForm: FormState | undefined, { model }: any) => {
      if (model.type === 'number') return 'number';
      if (model.type === 'boolean') return 'select';
      if (model.type === 'string') return 'text';

      return 'vs-code';
    },
    options: [
      { text: 'true', value: true },
      { text: 'false', value: false },
    ],
  },
  {
    name: 'enable',
    text: '是否可用',
    type: 'switch',
    defaultValue: true,
  },
  {
    name: 'fields',
    type: 'data-source-fields',
    defaultValue: [],
    display: (formState: FormState | undefined, { model }: any) => model.type === 'object' || model.type === 'array',
  },
];

const addFromJsonDialog = ref<InstanceType<typeof MFormDrawer>>();
const jsonFromConfig: FormConfig = [
  {
    name: 'data',
    type: 'vs-code',
    labelWidth: '0',
    language: 'json',
    height: '600px',
    options: inject('codeOptions', {}),
  },
];

const jsonFromValues = ref({
  data: {},
});

const newFromJsonHandler = () => {
  jsonFromValues.value.data = getDefaultValueFromFields(props.model[props.name]);
  addFromJsonDialog.value?.show();
};

const getValueType = (value: any) => {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return 'string';

  return 'any';
};

const getFieldsConfig = (value: any, fields: DataSchema[] = []) => {
  if (!value || typeof value !== 'object') throw new Error('数据格式错误');

  const newFields: DataSchema[] = [];
  Object.entries(value).forEach(([key, value]) => {
    const type = getValueType(value);

    const oldField = fields.find((field) => field.name === key);

    let childFields: DataSchema[] = [];
    if (Array.isArray(value) && value.length > 0) {
      childFields = getFieldsConfig(value[0], oldField?.fields);
    } else if (type === 'object') {
      childFields = getFieldsConfig(value, oldField?.fields);
    }

    newFields.push({
      name: key,
      title: oldField?.title || key,
      type,
      description: oldField?.description || '',
      enable: oldField?.enable ?? true,
      defaultValue: value,
      fields: childFields,
    });
  });

  return newFields;
};

const addFromJsonFromChange = ({ data }: { data: string }) => {
  try {
    const value = JSON.parse(data);

    props.model[props.name] = getFieldsConfig(value, props.model[props.name]);

    addFromJsonDialog.value?.hide();

    emit('change', props.model[props.name]);
  } catch (e: any) {
    tMagicMessage.error(e.message);
  }
};
</script>
