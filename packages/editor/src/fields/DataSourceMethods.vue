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
import { nextTick, ref } from 'vue';
import { cloneDeep } from 'lodash-es';

import type { CodeBlockContent } from '@tmagic/core';
import { TMagicButton, tMagicMessageBox } from '@tmagic/design';
import type { ContainerChangeEventData, FieldProps } from '@tmagic/form';
import { type ColumnConfig, MagicTable } from '@tmagic/table';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import type { CodeParamStatement } from '@editor/type';
import { getEditorConfig } from '@editor/utils/config';

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

const codeConfig = ref<CodeBlockContent>();
const codeBlockEditor = ref<InstanceType<typeof CodeBlockEditor>>();

let editIndex = -1;

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
        handler: (method: CodeBlockContent, index: number) => {
          let codeContent = method.content || `({ params, dataSource, app }) => {\n  // place your code here\n}`;

          if (typeof codeContent !== 'string') {
            codeContent = codeContent.toString();
          }

          codeConfig.value = {
            ...cloneDeep(method),
            content: codeContent,
          };

          editIndex = index;

          nextTick(() => {
            codeBlockEditor.value?.show();
          });
        },
      },
      {
        text: '删除',
        buttonType: 'danger',
        handler: async (row: CodeBlockContent, index: number) => {
          await tMagicMessageBox.confirm(`确定删除${row.name}?`, '提示');
          props.model[props.name].splice(index, 1);
          emit('change', props.model[props.name]);
        },
      },
    ],
  },
];

const createCodeHandler = () => {
  codeConfig.value = {
    name: '',
    content: `({ params, dataSource, app, flowState }) => {\n  // place your code here\n}`,
    params: [],
  };

  editIndex = -1;

  nextTick(() => {
    codeBlockEditor.value?.show();
  });
};

const submitCodeHandler = (value: CodeBlockContent, data: ContainerChangeEventData) => {
  if (value.content) {
    // 在保存的时候转换代码内容
    const parseDSL = getEditorConfig('parseDSL');
    if (typeof value.content === 'string') {
      value.content = parseDSL<(...args: any[]) => any>(value.content);
    }
  }
  if (editIndex > -1) {
    emit('change', value, {
      modifyKey: editIndex,
      changeRecords: (data.changeRecords || []).map((item) => ({
        propPath: `${props.prop}.${editIndex}.${item.propPath}`,
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

  editIndex = -1;
  codeConfig.value = void 0;

  codeBlockEditor.value?.hide();
};
</script>
