<template>
  <div class="m-editor-wrapper" :class="isFullScreen ? 'fullScreen' : 'normal'">
    <magic-code-editor
      ref="codeEditor"
      class="m-editor-container"
      :init-values="`${codeContent}`"
      @save="saveCodeDraft"
      :language="language"
      :options="codeOptions"
    ></magic-code-editor>
    <div class="m-editor-content-bottom" v-if="editable">
      <TMagicButton type="primary" class="button" @click="toggleFullScreen">
        {{ isFullScreen ? '退出全屏' : '全屏' }}</TMagicButton
      >
      <TMagicButton type="primary" class="button" @click="saveAndClose">确认</TMagicButton>
      <TMagicButton type="primary" class="button" @click="close">关闭</TMagicButton>
    </div>
    <div class="m-editor-content-bottom" v-else>
      <TMagicButton type="primary" class="button" @click="toggleFullScreen">
        {{ isFullScreen ? '退出全屏' : '全屏' }}</TMagicButton
      >
      <TMagicButton type="primary" class="button" @click="close">关闭</TMagicButton>
    </div>
  </div>
</template>
<script lang="ts" setup name="MEditorCodeDraftEditor">
import { computed, inject, ref, watchEffect } from 'vue';
import type { Action } from 'element-plus';
import type * as monaco from 'monaco-editor';

import { TMagicButton, tMagicMessage, tMagicMessageBox } from '@tmagic/design';
import { Id } from '@tmagic/schema';
import { datetimeFormatter } from '@tmagic/utils';

import MagicCodeEditor from '@editor/layouts/CodeEditor.vue';
import type { Services } from '@editor/type';

const props = withDefaults(
  defineProps<{
    /** 代码id */
    id: Id;
    /** 代码内容 */
    content: string;
    /** 是否可编辑 */
    editable?: boolean;
    /** 是否自动保存草稿 */
    autoSaveDraft?: boolean;
    /** 编辑器参数 */
    codeOptions?: Object;
    /** 编辑器语言 */
    language?: string;
  }>(),
  {
    editable: true,
    autoSaveDraft: true,
  },
);
const emit = defineEmits(['close', 'saveAndClose']);

const services = inject<Services>('services');

const codeContent = ref<string>('');
const editorContent = ref<string>('');
const codeEditor = ref<InstanceType<typeof MagicCodeEditor>>();
// 原始代码内容
const originCodeContent = ref<string>('');
const isFullScreen = ref<boolean>(false);

const codeOptions = computed(() => ({
  ...props.codeOptions,
  readOnly: !props.editable,
}));

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
  tMagicMessage.success(`代码草稿保存成功 ${datetimeFormatter(new Date())}`);
};

// 保存并关闭
const saveAndClose = (): void => {
  if (!codeEditor.value || !props.editable) return;
  // 代码内容
  editorContent.value = (codeEditor.value.getEditor() as monaco.editor.IStandaloneCodeEditor)?.getValue();
  emit('saveAndClose', editorContent.value);
};

// 关闭弹窗
const close = async (): Promise<void> => {
  const codeDraft = services?.codeBlockService.getCodeDraft(props.id);
  if (codeDraft) {
    tMagicMessageBox
      .confirm('您有代码修改未保存，是否保存后再关闭？', '提示', {
        confirmButtonText: '保存并关闭',
        cancelButtonText: '直接关闭',
        type: 'warning',
        distinguishCancelAndClose: true,
      })
      .then(async () => {
        // 保存之后再关闭
        saveAndClose();
      })
      .catch((action: Action) => {
        if (action === 'cancel') {
          // 删除草稿 直接关闭
          services?.codeBlockService.removeCodeDraft(props.id);
          emit('close');
        }
      });
  } else {
    emit('close');
  }
};

// 切换全屏
const toggleFullScreen = (): void => {
  isFullScreen.value = !isFullScreen.value;
  if (codeEditor.value) {
    codeEditor.value.focus();
  }
};
</script>
