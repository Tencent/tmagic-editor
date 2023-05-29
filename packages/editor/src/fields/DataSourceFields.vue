<template>
  <div class="m-editor-data-source-fields">
    <MagicTable :data="model[name]" :columns="filedColumns"></MagicTable>

    <div class="m-editor-data-source-fields-footer">
      <TMagicButton size="small" type="primary" :disabled="disabled" plain @click="newHandler()">添加</TMagicButton>
    </div>

    <MFormDialog
      ref="addDialog"
      :title="filedTitle"
      :config="dataSourceFieldsConfig"
      :values="fieldValues"
      :parentValues="model[name]"
      @submit="fieldChange"
    ></MFormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { TMagicButton, tMagicMessageBox } from '@tmagic/design';
import { FormConfig, FormState, MFormDialog } from '@tmagic/form';
import { MagicTable } from '@tmagic/table';

defineOptions({
  name: 'MEditorDataSourceFields',
});

const props = withDefaults(
  defineProps<{
    config: {
      type: 'data-source-fields';
    };
    model: any;
    prop: string;
    disabled: boolean;
    name: string;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits(['change']);

const addDialog = ref<InstanceType<typeof MFormDialog>>();
const fieldValues = ref<Record<string, any>>({});
const filedTitle = ref('');

const newHandler = () => {
  if (!addDialog.value) return;
  fieldValues.value = {};
  filedTitle.value = '新增属性';
  addDialog.value.dialogVisible = true;
};

const fieldChange = ({ index, ...value }: Record<string, any>) => {
  if (!addDialog.value) return;

  if (index > -1) {
    props.model[props.name][index] = value;
  } else {
    props.model[props.name].push(value);
  }

  addDialog.value.dialogVisible = false;

  emit('change', props.model[props.name]);
};

const filedColumns = [
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
    prop: 'desc',
  },
  {
    label: '操作',
    fixed: 'right',
    actions: [
      {
        text: '编辑',
        handler: (row: Record<string, any>, index: number) => {
          if (!addDialog.value) return;
          fieldValues.value = {
            ...row,
            index,
          };
          filedTitle.value = `编辑${row.title}`;
          addDialog.value.dialogVisible = true;
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
  },
  {
    name: 'defaultValue',
    text: '默认值',
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
    display: (formState: FormState | undefined, { model }: any) => model.type === 'object',
  },
];
</script>
