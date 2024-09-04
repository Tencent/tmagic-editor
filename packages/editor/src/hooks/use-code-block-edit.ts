import { nextTick, ref } from 'vue';
import { cloneDeep } from 'lodash-es';

import type { CodeBlockContent } from '@tmagic/core';
import { tMagicMessage } from '@tmagic/design';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import type { CodeBlockService } from '@editor/services/codeBlock';

export const useCodeBlockEdit = (codeBlockService?: CodeBlockService) => {
  const codeConfig = ref<CodeBlockContent>();
  const codeId = ref<string>();
  const codeBlockEditor = ref<InstanceType<typeof CodeBlockEditor>>();

  // 新增代码块
  const createCodeBlock = async () => {
    if (!codeBlockService) {
      tMagicMessage.error('新增代码块失败');
      return;
    }

    codeConfig.value = {
      name: '',
      content: `({app, params}) => {\n  // place your code here\n}`,
      params: [],
    };

    codeId.value = await codeBlockService.getUniqueId();

    await nextTick();

    codeBlockEditor.value?.show();
  };

  // 编辑代码块
  const editCode = async (id: string) => {
    const codeBlock = await codeBlockService?.getCodeContentById(id);

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
    codeBlockEditor.value?.show();
  };

  // 删除代码块
  const deleteCode = async (key: string) => {
    codeBlockService?.deleteCodeDslByIds([key]);
  };

  const submitCodeBlockHandler = async (values: CodeBlockContent) => {
    if (!codeId.value) return;

    await codeBlockService?.setCodeDslById(codeId.value, values);

    codeBlockEditor.value?.hide();
  };

  return {
    codeId,
    codeConfig,
    codeBlockEditor,

    createCodeBlock,
    editCode,
    deleteCode,
    submitCodeBlockHandler,
  };
};
