<template>
  <div class="m-editor-data-source-methods">
    <MagicTable :data="model[name]" :columns="methodColumns"></MagicTable>

    <div class="m-editor-data-source-methods-footer">
      <TMagicButton size="small" type="primary" :disabled="disabled" plain @click="createCodeHandler"
        >添加</TMagicButton
      >
    </div>

    <CodeBlockEditor
      v-if="codeConfig"
      ref="codeBlockEditor"
      :disabled="disabled"
      :content="codeConfig"
      :is-data-source="true"
      :data-source-type="model.type"
      @submit="submitCodeHandler"
    ></CodeBlockEditor>
  </div>
</template>

<script setup lang="ts">
import { TMagicButton } from '@tmagic/design';
import type { FieldProps } from '@tmagic/form';
import type { CodeBlockContent } from '@tmagic/schema';
import { type ColumnConfig, MagicTable } from '@tmagic/table';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import { useDataSourceMethod } from '@editor/hooks/use-data-source-method';
import type { CodeParamStatement } from '@editor/type';

defineOptions({
  name: 'MFieldsDataSourceMethods',
});

const props = withDefaults(
  defineProps<
    FieldProps<{
      type: 'data-source-methods';
    }>
  >(),
  {
    disabled: false,
  },
);

const emit = defineEmits(['change']);

const { codeConfig, codeBlockEditor, createCode, editCode, deleteCode, submitCode } = useDataSourceMethod();

const methodColumns: ColumnConfig[] = [
  {
    label: '名称',
    prop: 'name',
  },
  {
    label: '描述',
    prop: 'desc',
  },
  {
    label: '执行时机',
    prop: 'timing',
  },
  {
    label: '参数',
    prop: 'params',
    formatter: (params: CodeParamStatement[]) => params.map((item) => item.name).join(', '),
  },
  {
    label: '操作',
    fixed: 'right',
    actions: [
      {
        text: '编辑',
        handler: (row: CodeBlockContent) => {
          editCode(props.model, row.name);
          emit('change', props.model[props.name]);
        },
      },
      {
        text: '删除',
        buttonType: 'danger',
        handler: (row: CodeBlockContent) => {
          deleteCode(props.model, row.name);
          emit('change', props.model[props.name]);
        },
      },
    ],
  },
];

const createCodeHandler = () => {
  createCode(props.model);

  emit('change', props.model[props.name]);
};

const submitCodeHandler = (values: CodeBlockContent) => {
  submitCode(values);

  emit('change', props.model[props.name]);
};
</script>
