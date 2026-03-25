import { nextTick, ref, useTemplateRef } from 'vue';
import { cloneDeep } from 'lodash-es';

import type { CodeBlockContent } from '@tmagic/core';
import { tMagicMessage } from '@tmagic/design';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import type { Services } from '@editor/type';

export const useCodeBlockEdit = (codeBlockService: Services['codeBlockService']) => {
  const codeConfig = ref<CodeBlockContent>();
  const codeId = ref<string>();
  const codeBlockEditorRef = useTemplateRef<InstanceType<typeof CodeBlockEditor>>('codeBlockEditor');

  // 新增代码块
  const createCodeBlock = async () => {
    codeConfig.value = {
      name: '',
      content: '({app, params, flowState}) => {\n  // place your code here\n}',
      params: [],
    };

    codeId.value = await codeBlockService.getUniqueId();

    await nextTick();

    codeBlockEditorRef.value?.show();
  };

  // 编辑代码块
  const editCode = async (id: string) => {
    const codeBlock = await codeBlockService.getCodeContentById(id);

    if (!codeBlock) {
      tMagicMessage.error('获取代码块内容失败');
      return;
    }

    let codeContent = codeBlock.content;

    if (typeof codeContent !== 'string') {
      codeContent = codeContent.toString();
    }

    codeConfig.value = {
      ...cloneDeep(codeBlock),
      content: codeContent,
    };
    codeId.value = id;

    await nextTick();
    codeBlockEditorRef.value?.show();
  };

  // 删除代码块
  const deleteCode = async (key: string) => {
    codeBlockService.deleteCodeDslByIds([key]);
  };

  const submitCodeBlockHandler = async (values: CodeBlockContent) => {
    if (!codeId.value) return;

    await codeBlockService.setCodeDslById(codeId.value, values);

    codeBlockEditorRef.value?.hide();
  };

  return {
    codeId,
    codeConfig,
    codeBlockEditor: codeBlockEditorRef,

    createCodeBlock,
    editCode,
    deleteCode,
    submitCodeBlockHandler,
  };
};
