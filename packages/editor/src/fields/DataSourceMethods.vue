<template>
  <div class="m-editor-data-source-methods">
    <MagicTable :data="model[name]" :columns="displayColumns" :border="true"></MagicTable>

    <div v-if="!isCompare" class="m-editor-data-source-methods-footer">
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
import { computed, inject, nextTick, ref, useTemplateRef } from 'vue';
import { cloneDeep } from 'lodash-es';

import type { CodeBlockContent } from '@tmagic/core';
import { TMagicButton, tMagicMessageBox } from '@tmagic/design';
import type { ContainerChangeEventData, DataSourceMethodsConfig, FieldProps, FormState } from '@tmagic/form';
import { type ColumnConfig, MagicTable } from '@tmagic/table';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import type { CodeParamStatement } from '@editor/type';

defineOptions({
  name: 'MFieldsDataSourceMethods',
});

const props = withDefaults(defineProps<FieldProps<DataSourceMethodsConfig>>(), {
  disabled: false,
});

const emit = defineEmits(['change']);

const mForm = inject<FormState | undefined>('mForm');

/** 对比模式下隐藏新增/编辑/删除等操作按钮，仅保留只读展示。 */
const isCompare = computed(() => Boolean(mForm?.isCompare));

const codeConfig = ref<Omit<CodeBlockContent, 'content'> & { content: string }>();
const codeBlockEditorRef = useTemplateRef<InstanceType<typeof CodeBlockEditor>>('codeBlockEditor');

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
    formatter: (params: CodeParamStatement[] = []) => params.map((item) => item.name).join(', '),
  },
  {
    label: '操作',
    fixed: 'right',
    actions: [
      {
        text: '编辑',
        handler: (method: CodeBlockContent, index: number) => {
          let codeContent: string = '({ params, dataSource, app }) => {\n  // place your code here\n}';

          if (method.content) {
            if (typeof method.content !== 'string') {
              codeContent = method.content.toString();
            } else {
              codeContent = method.content;
            }
          }

          codeConfig.value = {
            ...cloneDeep(method),
            content: codeContent,
          };

          editIndex = index;

          nextTick(() => {
            codeBlockEditorRef.value?.show();
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

/** 对比模式下移除「操作」列（编辑/删除按钮），仅保留只读列。 */
const displayColumns = computed<ColumnConfig[]>(() =>
  isCompare.value ? methodColumns.filter((col) => !col.actions) : methodColumns,
);

const createCodeHandler = () => {
  codeConfig.value = {
    name: '',
    content: '({ params, dataSource, app, flowState }) => {\n  // place your code here\n}',
    params: [],
  };

  editIndex = -1;

  nextTick(() => {
    codeBlockEditorRef.value?.show();
  });
};

const submitCodeHandler = (value: CodeBlockContent, data: ContainerChangeEventData) => {
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

  codeBlockEditorRef.value?.hide();
};
</script>
