<template>
  <TMagicCard shadow="never">
    <template #header>
      <div class="code-name-wrapper">
        <div class="code-name-label">代码块名称</div>
        <TMagicInput class="code-name-input" v-model="codeName" :disabled="!editable" />
      </div>
    </template>
    <CodeDraftEditor
      :id="id"
      :content="codeContent"
      :editable="editable"
      :autoSaveDraft="autoSaveDraft"
      :codeOptions="codeOptions"
      language="javascript"
      @save="saveCode"
      @saveAndClose="saveAndClose"
      @close="close"
    ></CodeDraftEditor>
  </TMagicCard>
</template>
<script lang="ts" setup>
import { inject, ref, watchEffect } from 'vue';

import { TMagicCard, TMagicInput, tMagicMessage } from '@tmagic/design';
import { Id } from '@tmagic/schema';

import type { Services } from '../type';

import CodeDraftEditor from './CodeDraftEditor.vue';

const props = withDefaults(
  defineProps<{
    id: Id;
    name: string;
    content: string;
    editable?: boolean;
    autoSaveDraft?: boolean;
    codeOptions?: object;
  }>(),
  {
    editable: true,
    autoSaveDraft: true,
  },
);

const services = inject<Services>('services');

const codeName = ref<string>('');
const codeContent = ref<string>('');
const evalRes = ref(true);

watchEffect(() => {
  codeName.value = props.name;
  codeContent.value = props.content;
});

// 保存前钩子
const beforeSave = (codeValue: string): boolean => {
  try {
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
    });
    tMagicMessage.success('代码保存成功');
    // 删除草稿
    services?.codeBlockService.removeCodeDraft(props.id);
  }
};

// 保存并关闭
const saveAndClose = async (codeValue: string) => {
  await saveCode(codeValue);
  if (evalRes.value) {
    close();
  }
};

// 关闭弹窗
const close = () => {
  services?.codeBlockService.setCodeEditorShowStatus(false);
};
</script>
