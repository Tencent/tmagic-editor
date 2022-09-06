<template>
  <div class="m-editor-code-block-list">
    <slot name="code-block-panel-header"></slot>
    <div class="create-code-button">
      <el-button type="primary" size="small" @click="createCodeBlock">新增代码块</el-button>
    </div>
    <el-divider class="divider" />

    <!-- 代码块列表 -->
    <div class="list-container"></div>

    <!-- 代码块编辑区 -->
    <code-block-editor />
  </div>
</template>

<script lang="ts" setup>
import codeBlockEditor from './CodeBlockEditor.vue';
import useCodeBlock from './useCodeBlock';
const { createCodeBlock } = useCodeBlock();
</script>
