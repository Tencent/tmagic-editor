<template>
  <div ref="codeBlockEditor" class="m-editor-code-block-editor-panel" v-if="state.isShowCodeBlockEditor">
    <div class="header">
      <h3 class="title">代码块编辑面板</h3>
      <el-button class="close-btn" circle :icon="Close" type="danger" bg :text="false" @click="closePanel"></el-button>
    </div>
    <el-row :gutter="20" class="code-name-wrapper">
      <el-col :span="6">
        <span>代码块名称</span>
      </el-col>
      <el-col :span="6">
        <el-input size="small" v-model="state.codeConfig.name" />
      </el-col>
    </el-row>
    <div class="m-editor-content" :class="isFullScreen ? 'fullScreen' : 'normal'">
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
        <el-button type="primary" class="button" @click="toggleFullScreen">
          {{ isFullScreen ? '退出全屏' : '全屏' }}
        </el-button>
        <el-button type="primary" class="button" @click="saveCode">保存</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, ref, watchEffect } from 'vue';
import { Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import type { Services } from '../type';

import useCodeBlock from './useCodeBlock';

const { state, closePanel } = useCodeBlock();
let parentElement: HTMLElement | null = null;
const isFullScreen = ref(false);
const codeBlockEditor = ref<HTMLElement | null>(null);
const codeEditor = ref<any | null>(null);
const services = inject<Services>('services');

watchEffect(() => {
  if (state.isShowCodeBlockEditor) {
    if (!codeBlockEditor.value) {
      return;
    }
    parentElement = codeBlockEditor.value.parentElement;
  }
});

// 切换全屏
const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value;

  if (!codeBlockEditor.value) return;
  if (isFullScreen.value) {
    globalThis.document.body.appendChild(codeBlockEditor.value);
  } else if (parentElement) {
    parentElement.appendChild(codeBlockEditor.value);
  } else {
    codeBlockEditor.value.remove();
  }

  setTimeout(() => {
    if (!codeEditor.value) return;
    codeEditor.value.focus();
    codeEditor.value.getEditor().layout();
  });
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
