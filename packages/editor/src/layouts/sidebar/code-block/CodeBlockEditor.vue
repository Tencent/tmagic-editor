<template>
  <el-dialog v-model="isShowCodeBlockEditor" title="代码块编辑面板" :fullscreen="true">
    <div class="m-editor-code-block-editor-panel">
      <slot name="code-block-edit-panel-header" :id="id"></slot>
      <el-row class="code-name-wrapper" justify="start">
        <el-col :span="2">
          <span>代码块名称</span>
        </el-col>
        <el-col :span="6">
          <el-input size="small" v-model="codeConfig.name" />
        </el-col>
      </el-row>
      <div class="m-editor-content">
        <magic-code-editor
          ref="codeEditor"
          class="m-editor-content"
          :init-values="codeConfig.content"
          @save="saveCode"
          :options="{
            tabSize: 2,
            fontSize: 16,
            formatOnPaste: true,
          }"
        ></magic-code-editor>
        <div class="m-editor-content-bottom clearfix">
          <el-button type="primary" class="button" @click="saveCode">保存</el-button>
          <el-button type="primary" class="button" @click="saveAndClose">保存并关闭</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, defineProps, inject, ref, watchEffect } from 'vue';
import { ElMessage } from 'element-plus';

import type { CodeBlockContent, Services } from '../../../type';

const props = defineProps<{
  id: string;
}>();
const services = inject<Services>('services');

const codeEditor = ref<any | null>(null);
// 编辑器当前需展示的代码块内容
const codeConfig = ref<CodeBlockContent | null>(null);

// 是否展示代码编辑区
const isShowCodeBlockEditor = computed(() => codeConfig.value && services?.codeBlockService.getCodeEditorShowStatus());

watchEffect(() => {
  codeConfig.value = services?.codeBlockService.getCodeDslById(props.id) ?? null;
});

// 保存代码
const saveCode = () => {
  if (!codeEditor.value || !codeConfig.value) return;

  try {
    // 代码内容
    const codeContent = codeEditor.value.getEditor().getValue();
    /* eslint no-eval: "off" */
    codeConfig.value.content = eval(codeContent);
  } catch (e: any) {
    ElMessage.error(e.stack);
    return;
  }
  // 存入dsl
  services?.codeBlockService.setCodeDslById(props.id, {
    name: codeConfig.value.name,
    content: codeConfig.value.content,
  });
  ElMessage.success('代码保存成功');
};

// 保存并关闭
const saveAndClose = () => {
  saveCode();
  services?.codeBlockService.setCodeEditorShowStatus(false);
};
</script>
