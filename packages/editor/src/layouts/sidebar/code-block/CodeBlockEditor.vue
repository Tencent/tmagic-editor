<template>
  <el-dialog v-model="state.isShowCodeBlockEditor" title="代码块编辑面板" :fullscreen="true">
    <div ref="codeBlockEditor" class="m-editor-code-block-editor-panel">
      <el-row class="code-name-wrapper" justify="start">
        <el-col :span="2">
          <span>代码块名称</span>
        </el-col>
        <el-col :span="6">
          <el-input size="small" v-model="state.codeConfig.name" />
        </el-col>
      </el-row>
      <div class="m-editor-content">
        <magic-code-editor
          ref="codeEditor"
          class="m-editor-content"
          :init-values="state.codeConfig.content"
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
import { inject, ref, watchEffect } from 'vue';
import { ElMessage } from 'element-plus';

import type { Services } from '../../../type';

import useCodeBlock from './useCodeBlock';

const { state, closePanel } = useCodeBlock();
const codeBlockEditor = ref<HTMLElement | null>(null);
const codeEditor = ref<any | null>(null);
const services = inject<Services>('services');

watchEffect(() => {
  if (state.isShowCodeBlockEditor) {
    if (!codeBlockEditor.value) {
      return;
    }
  }
});

// 保存并关闭
const saveAndClose = () => {
  saveCode();
  closePanel();
};

// 保存代码
const saveCode = () => {
  if (!codeEditor.value || !state.codeConfig) return;

  try {
    const codeContent = codeEditor.value.getEditor().getValue();
    /* eslint no-eval: "off" */
    state.codeConfig.content = eval(codeContent);
    const { id, ...codeConfig } = state.codeConfig;
    const { editorService } = services || {};
    if (!editorService) return;
    const root = editorService.get('root');

    // 代码块id作为key
    let codeBlockList = root?.method || {};
    codeBlockList = {
      ...codeBlockList,
      ...{
        [state.codeConfig.id]: codeConfig,
      },
    };

    // 写入dsl
    editorService.set('root', {
      ...root,
      method: codeBlockList,
    });

    ElMessage.success('代码保存成功');
  } catch (e: any) {
    ElMessage.error(e.stack);
  }
};
</script>
