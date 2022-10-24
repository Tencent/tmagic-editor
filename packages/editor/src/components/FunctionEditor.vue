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
      @save="saveCode"
      @close="close"
    ></CodeDraftEditor>
  </TMagicCard>
</template>
<script lang="ts" setup>
import { inject, ref, watchEffect } from 'vue';

import { TMagicCard, TMagicInput, tMagicMessage } from '@tmagic/design';

import type { Services } from '../type';

import CodeDraftEditor from './CodeDraftEditor.vue';

const props = withDefaults(
  defineProps<{
    id: string;
    name: string;
    content: string;
    editable?: boolean;
    autoSaveDraft?: boolean;
  }>(),
  {
    editable: true,
    autoSaveDraft: true,
  },
);

const services = inject<Services>('services');

const codeName = ref<string>('');
const codeContent = ref<string>('');

watchEffect(() => {
  codeName.value = props.name;
  codeContent.value = props.content;
});

// 保存代码
const saveCode = async (codeValue: string): Promise<void> => {
  if (!props.editable) return;

  // 存入dsl
  await services?.codeBlockService.setCodeDslById(props.id, {
    name: codeName.value,
    content: codeValue,
  });
  tMagicMessage.success('代码保存成功');
};

// 关闭弹窗
const close = () => {
  services?.codeBlockService.setCodeEditorShowStatus(false);
};
</script>
