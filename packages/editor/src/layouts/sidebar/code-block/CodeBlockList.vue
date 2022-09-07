<template>
  <div class="m-editor-code-block-list">
    <slot name="code-block-panel-header">
      <div class="create-code-button">
        <el-button type="primary" size="small" @click="createCodeBlock">新增代码块</el-button>
      </div>
      <el-divider class="divider" />
    </slot>

    <!-- 代码块列表 -->
    <div class="list-container" v-if="state.codeBlockMap">
      <div v-for="(value, key) in state.codeBlockMap" :key="key">
        <div class="list-item">
          <div class="code-name">{{ value.name }}（{{ key }}）</div>
          <div class="right-tool">
            <el-tooltip effect="dark" content="编辑代码" placement="top">
              <el-icon class="edit-icon" @click="editCode(key)"><Edit /></el-icon>
            </el-tooltip>
            <slot name="code-block-panel-tool"></slot>
          </div>
        </div>
      </div>
    </div>

    <!-- 代码块编辑区 -->
    <code-block-editor :state="state" @close="closePanel"></code-block-editor>
  </div>
</template>

<script lang="ts" setup>
import { inject, reactive, watchEffect } from 'vue';
import { Edit } from '@element-plus/icons-vue';

import type { CodeBlockConfig, Services, State } from '../../../type';

import codeBlockEditor from './CodeBlockEditor.vue';

const state = reactive<State>({
  isShowCodeBlockEditor: false,
  codeConfig: null,
  codeBlockMap: null,
});
const services = inject<Services>('services');

// 新增代码块
const createCodeBlock = () => {
  const config: CodeBlockConfig = {
    id: getUniqueId(),
    name: '代码块',
    content: `(app) => {\n  // place your code here\n}`,
  };
  showCodeEditor(config);
};

// 展示代码编辑区
const showCodeEditor = (config: CodeBlockConfig) => {
  state.codeConfig = config;
  showPanel();
};

// 打开代码块面板
const showPanel = () => (state.isShowCodeBlockEditor = true);

// 关闭代码块面板
const closePanel = () => (state.isShowCodeBlockEditor = false);

// 生成代码块唯一id
const getUniqueId = () => (Date.now().toString(36) + Math.random().toString(36).substring(2)).padEnd(19, '0');

// 编辑代码块
const editCode = (key: string) => {
  if (!state.codeBlockMap) return;
  // 获取对应Id的代码块
  const currentCode = state.codeBlockMap[key];
  const config: CodeBlockConfig = {
    id: key,
    ...currentCode,
  };
  showCodeEditor(config);
};

watchEffect(() => {
  const { editorService } = services || {};
  if (!editorService) return;
  const root = editorService.get('root');
  state.codeBlockMap = root?.method || null;
});
</script>
