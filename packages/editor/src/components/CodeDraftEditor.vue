<template>
  <div class="m-editor-wrapper">
    <magic-code-editor
      ref="codeEditor"
      class="m-editor-container"
      :init-values="`${codeContent}`"
      @save="saveCodeDraft"
      :options="{
        tabSize: 2,
        fontSize: 16,
        formatOnPaste: true,
        readOnly: !editable,
      }"
    ></magic-code-editor>
    <div class="m-editor-content-bottom" v-if="editable">
      <TMagicButton type="primary" class="button" @click="saveCode">保存</TMagicButton>
      <TMagicButton type="primary" class="button" @click="close">关闭</TMagicButton>
    </div>
    <div class="m-editor-content-bottom" v-else>
      <TMagicButton type="primary" class="button" @click="close">关闭</TMagicButton>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { inject, ref, watchEffect } from 'vue';
import type * as monaco from 'monaco-editor';

import { TMagicButton, tMagicMessage, tMagicMessageBox } from '@tmagic/design';
import { datetimeFormatter } from '@tmagic/utils';

import MagicCodeEditor from '../layouts/CodeEditor.vue';
import type { Services } from '../type';

// 草稿提示延时，避免点击保存时出现两次提醒
const draftTipTimeOut = 100;

const props = withDefaults(
  defineProps<{
    /** 代码id */
    id: string;
    /** 代码内容 */
    content: string;
    /** 是否可编辑 */
    editable?: boolean;
    /** 是否自动保存草稿 */
    autoSaveDraft?: boolean;
  }>(),
  {
    editable: true,
    autoSaveDraft: true,
  },
);
const emit = defineEmits(['save', 'close']);

const services = inject<Services>('services');

const codeContent = ref<string>('');
const codeEditor = ref<InstanceType<typeof MagicCodeEditor>>();
// 原始代码内容
const originCodeContent = ref<string | null>(null);
// 是否展示草稿保存提示语
const shouldShowDraftTip = ref(true);

watchEffect(() => {
  codeContent.value = props.content;
  if (!originCodeContent.value) {
    // 暂存原始的代码内容
    originCodeContent.value = codeContent.value;
  }
  // 有草稿时展示上次保存的草稿内容
  const codeDraft = services?.codeBlockService.getCodeDraft(props.id);
  if (codeDraft) {
    codeContent.value = codeDraft;
  }
});

// 保存草稿
const saveCodeDraft = async (codeValue: string) => {
  if (!props.autoSaveDraft) return;
  if (originCodeContent.value === codeValue) {
    // 没修改或改回原样 有草稿的话删除草稿
    services?.codeBlockService.removeCodeDraft(props.id);
    return;
  }
  services?.codeBlockService.setCodeDraft(props.id, codeValue);

  setTimeout(() => {
    if (shouldShowDraftTip.value) {
      tMagicMessage.success(`代码草稿保存成功 ${datetimeFormatter(new Date())}`);
    }
  }, draftTipTimeOut);
};

// 保存代码
const saveCode = async (): Promise<boolean> => {
  if (!codeEditor.value || !props.editable) return true;

  try {
    // 代码内容
    const editorContent = (codeEditor.value.getEditor() as monaco.editor.IStandaloneCodeEditor)?.getValue();
    /* eslint no-eval: "off" */
    eval(editorContent);
    // 不重复提示
    shouldShowDraftTip.value = false;
    // 删除草稿
    services?.codeBlockService.removeCodeDraft(props.id);
    emit('save', editorContent);
    return true;
  } catch (e: any) {
    tMagicMessage.error(e.stack);
    return false;
  }
};

const beforeClose = async () => {
  const codeDraft = services?.codeBlockService.getCodeDraft(props.id);
  if (!codeDraft || !props.autoSaveDraft) {
    return await saveCode();
  }
  let saveRes = true;
  await tMagicMessageBox
    .confirm('您有代码修改未保存，是否保存后再关闭？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    .then(async () => {
      // 保存之后再关闭
      saveRes = await saveCode();
    })
    .catch(() => {
      // 删除草稿 直接关闭
      services?.codeBlockService.removeCodeDraft(props.id);
    });
  return saveRes;
};

// 关闭弹窗
const close = async () => {
  const shouldClose = await beforeClose();
  if (shouldClose) {
    emit('close');
  }
};
</script>
