<template>
  <TMagicCard shadow="never">
    <template #header>
      <div class="code-name-wrapper">
        <div class="code-name-label">代码块名称</div>
        <TMagicInput class="code-name-input" v-model="codeName" :disabled="!editable" />
      </div>
      <div class="code-name-wrapper">
        <div class="code-name-label">参数</div>
        <m-form-table
          style="width: 800px"
          :config="tableConfig"
          :model="tableModel"
          :enableToggleMode="false"
          name="params"
          prop="params"
          size="small"
        >
        </m-form-table>
      </div>
    </template>
    <CodeDraftEditor
      :id="id"
      :content="codeContent"
      :editable="editable"
      :autoSaveDraft="autoSaveDraft"
      :codeOptions="codeOptions"
      language="javascript"
      @saveAndClose="saveAndClose"
      @close="close"
    ></CodeDraftEditor>
  </TMagicCard>
</template>
<script lang="ts" setup name="MEditorFunctionEditor">
import { inject, provide, ref, watchEffect } from 'vue';
import { cloneDeep } from 'lodash-es';

import { TMagicCard, TMagicInput, tMagicMessage } from '@tmagic/design';
import { ColumnConfig, TableConfig } from '@tmagic/form';
import { CodeParam, Id } from '@tmagic/schema';

import type { Services } from '@editor/type';

import CodeDraftEditor from './CodeDraftEditor.vue';
const defaultParamColConfig: ColumnConfig = {
  type: 'row',
  label: '参数类型',
  items: [
    {
      text: '参数类型',
      labelWidth: '70px',
      type: 'select',
      name: 'type',
      options: [
        {
          text: '数字',
          label: '数字',
          value: 'number',
        },
        {
          text: '字符串',
          label: '字符串',
          value: 'text',
        },
      ],
    },
  ],
};

const props = withDefaults(
  defineProps<{
    /** 代码块id */
    id: Id;
    /** 代码块名称 */
    name: string;
    /** 代码内容 */
    content: string;
    /** 是否可编辑 */
    editable?: boolean;
    /** 是否自动保存草稿 */
    autoSaveDraft?: boolean;
    /** 编辑器扩展参数 */
    codeOptions?: object;
    /** 代码参数扩展配置 */
    paramsColConfig?: ColumnConfig;
  }>(),
  {
    editable: true,
    autoSaveDraft: true,
  },
);

const paramsColConfig = props.paramsColConfig || defaultParamColConfig;

const tableConfig: TableConfig = {
  type: 'table',
  border: true,
  enableFullscreen: false,
  name: 'params',
  maxHeight: '300px',
  dropSort: false,
  items: [
    {
      type: 'text',
      label: '参数名',
      name: 'name',
      width: 200,
    },
    {
      type: 'text',
      label: '参数注释',
      name: 'tip',
      width: 200,
    },
    paramsColConfig,
  ],
};

const emit = defineEmits(['change', 'field-input']);

const services = inject<Services>('services');

const codeName = ref<string>('');
const codeContent = ref<string>('');
const evalRes = ref(true);

provide('mForm', {
  $emit: emit,
  setField: () => {},
});

const tableModel = ref<{ params: CodeParam[] }>();
watchEffect(() => {
  codeName.value = props.name;
  codeContent.value = props.content;
});

const initTableModel = (): void => {
  const codeDsl = cloneDeep(services?.codeBlockService.getCodeDsl());
  if (!codeDsl) return;
  tableModel.value = {
    params: codeDsl[props.id]?.params || [],
  };
};

initTableModel();

// 保存前钩子
const beforeSave = (codeValue: string): boolean => {
  try {
    // eval检测js代码是否存在语法错误
    // eslint-disable-next-line no-eval
    eval(codeValue);
    return true;
  } catch (e: any) {
    tMagicMessage.error(e.stack);
    return false;
  }
};

// 保存代码
const saveCode = async (codeValue: string): Promise<void> => {
  if (!props.editable) return;
  evalRes.value = beforeSave(codeValue);
  if (evalRes.value) {
    // 存入dsl
    await services?.codeBlockService.setCodeDslById(props.id, {
      name: codeName.value,
      content: codeValue,
      params: tableModel.value?.params || [],
    });
    tMagicMessage.success('代码保存成功');
    // 删除草稿
    services?.codeBlockService.removeCodeDraft(props.id);
  }
};

// 保存并关闭
const saveAndClose = async (codeValue: string): Promise<void> => {
  await saveCode(codeValue);
  if (evalRes.value) {
    close();
  }
};

// 关闭弹窗
const close = (): void => {
  services?.codeBlockService.setCodeEditorShowStatus(false);
};
</script>
