<template>
  <div class="m-editor-data-source-fields">
    <MagicTable :data="model[name]" :columns="displayColumns" :border="true"></MagicTable>

    <div v-if="!isCompare" class="m-editor-data-source-fields-footer">
      <TMagicButton size="small" :disabled="disabled" plain @click="newFromJsonHandler()">快速添加</TMagicButton>
      <TMagicButton size="small" type="primary" :disabled="disabled" plain @click="newHandler()">添加</TMagicButton>
    </div>

    <FloatingBox
      :body-style="{ padding: '0 16px' }"
      v-model:visible="addDialogVisible"
      v-model:width="width"
      v-model:height="editorHeight"
      :title="fieldTitle"
      :position="boxPosition"
    >
      <template #body>
        <MFormBox
          label-width="80px"
          :title="fieldTitle"
          :config="dataSourceFieldsConfig"
          :values="fieldValues"
          :parentValues="model[name]"
          :disabled="disabled"
          @submit="fieldChange"
        ></MFormBox>
      </template>
    </FloatingBox>

    <FloatingBox
      :body-style="{ padding: '0 16px' }"
      v-model:visible="addFromJsonDialogVisible"
      v-model:width="width"
      v-model:height="editorHeight"
      title="快速添加数据定义"
      :position="boxPosition"
    >
      <template #body>
        <MFormBox
          :config="jsonFromConfig"
          :values="jsonFromValues"
          :disabled="disabled"
          @submit="addFromJsonFromChange"
        ></MFormBox>
      </template>
    </FloatingBox>
  </div>
</template>

<script setup lang="ts">
import { computed, type ComputedRef, inject, onMounted, provide, Ref, ref } from 'vue';

import type { DataSchema } from '@tmagic/core';
import { TMagicButton, tMagicMessage, tMagicMessageBox } from '@tmagic/design';
import {
  type CodeConfig,
  type ContainerChangeEventData,
  type DataSourceFieldsConfig,
  type FieldProps,
  type FormConfig,
  type FormState,
  MFormBox,
  type NumberConfig,
  type TextConfig,
} from '@tmagic/form';
import { type ColumnConfig, MagicTable } from '@tmagic/table';
import { getDefaultValueFromFields } from '@tmagic/utils';

import FloatingBox from '@editor/components/FloatingBox.vue';
import { useEditorContentHeight } from '@editor/hooks';
import { useNextFloatBoxPosition } from '@editor/hooks/use-next-float-box-position';
import { useServices } from '@editor/hooks/use-services';
import { error } from '@editor/utils/logger';

defineOptions({
  name: 'MFieldsDataSourceFields',
});

const props = withDefaults(defineProps<FieldProps<DataSourceFieldsConfig>>(), {
  disabled: false,
});

const emit = defineEmits<{
  change: [v: any, eventData?: ContainerChangeEventData];
}>();

const { uiService } = useServices();
const mForm = inject<FormState | undefined>('mForm');

/** 对比模式下隐藏新增/编辑/删除等操作按钮，仅保留只读展示。 */
const isCompare = computed(() => Boolean(mForm?.isCompare));

const fieldValues = ref<Record<string, any>>({});
const fieldTitle = ref('');

const width = defineModel<number>('width', { default: 670 });

const newHandler = () => {
  fieldValues.value = {};
  fieldTitle.value = '新增属性';
  calcBoxPosition();
  addDialogVisible.value = true;
};

const editField = (row: Record<string, any>, index: number) => {
  fieldValues.value = {
    ...row,
    index,
  };
  fieldTitle.value = `编辑${row.title}`;
  calcBoxPosition();
  addDialogVisible.value = true;
};

const fieldChange = ({ index, ...value }: Record<string, any>, data: ContainerChangeEventData) => {
  addDialogVisible.value = false;

  if (index > -1) {
    emit('change', value, {
      modifyKey: index,
      changeRecords: (data.changeRecords || []).map((item) => ({
        propPath: `${props.prop}.${index}.${item.propPath}`,
        value: item.value,
      })),
    });
  } else {
    const modifyKey = props.model[props.name].length;
    emit('change', value, {
      modifyKey,
      changeRecords: [
        {
          propPath: `${props.prop}.${modifyKey}`,
          value,
        },
      ],
    });
  }
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
        error(e);
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
          editField(row, index);
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

/** 对比模式下移除「操作」列（编辑/删除按钮），仅保留只读列。 */
const displayColumns = computed<ColumnConfig[]>(() =>
  isCompare.value ? fieldColumns.filter((col) => !col.actions) : fieldColumns,
);

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
    onChange: (_formState, v: string, { setModel }) => {
      if (!['any', 'array', 'object'].includes(v)) {
        setModel('fields', []);
      }
      return v;
    },
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
    parse: true,
    mFormItemType: 'data-source-field-defaultValue',
    type: (mForm: FormState | undefined, { model }: any) => {
      if (model.type === 'number') return 'number';
      if (model.type === 'boolean') return 'select';
      if (model.type === 'string') return 'text';

      return 'vs-code';
    },
    autosize: { minRows: 1, maxRows: 30 },
    options: [
      { text: 'true', value: true },
      { text: 'false', value: false },
    ],
  } as unknown as CodeConfig | NumberConfig | TextConfig,
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

const jsonFromConfig: FormConfig = [
  {
    name: 'data',
    type: 'vs-code',
    labelWidth: '0',
    language: 'json',
    autosize: { minRows: 30, maxRows: 50 },
    options: inject('codeOptions', {}),
  },
];

const jsonFromValues = ref({
  data: {},
});

const newFromJsonHandler = () => {
  jsonFromValues.value.data = getDefaultValueFromFields(props.model[props.name]);
  calcBoxPosition();
  addFromJsonDialogVisible.value = true;
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

    addFromJsonDialogVisible.value = false;

    emit('change', getFieldsConfig(value, props.model[props.name]));
  } catch (e: any) {
    tMagicMessage.error(e.message);
  }
};

const addDialogVisible = defineModel<boolean>('visible', { default: false });
const addFromJsonDialogVisible = defineModel<boolean>('visible1', { default: false });
const { height: editorHeight } = useEditorContentHeight();

const parentFloating = inject<Ref<HTMLDivElement | null>>('parentFloating', ref(null));
const { boxPosition, calcBoxPosition } = useNextFloatBoxPosition(uiService, parentFloating);

/**
 * 由 DataSourceConfigPanel 注入：打开数据源详情后需要直接打开的字段路径（字段名数组）。
 * 当前层消费 path[0]，并把剩余路径下发给嵌套字段，实现逐层打开。
 */
const editingFieldPath = inject<ComputedRef<string[]>>(
  'editingDataSourceFieldPath',
  computed(() => []),
);

provide(
  'editingDataSourceFieldPath',
  computed(() => editingFieldPath.value.slice(1)),
);

onMounted(() => {
  const path = editingFieldPath.value;
  if (!path.length) return;

  const fields: Record<string, any>[] = props.model[props.name] || [];
  const index = fields.findIndex((field) => field.name === path[0]);
  if (index === -1) return;

  editField(fields[index], index);
});
</script>
