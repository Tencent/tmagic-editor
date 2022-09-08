<template>
  <div class="m-editor-code-block-list">
    <slot name="code-block-panel-header">
      <div class="create-code-button">
        <el-button type="primary" size="small" @click="createCodeBlock">新增代码块</el-button>
      </div>
      <el-divider class="divider" />
    </slot>

    <!-- 代码块列表 -->
    <div class="list-container" v-if="codeList">
      <div v-for="(value, key) in codeList" :key="key">
        <div class="list-item">
          <div class="code-name">{{ value.name }}（{{ key }}）</div>
          <div class="right-tool">
            <el-tooltip effect="dark" content="编辑代码" placement="top">
              <el-icon class="edit-icon" @click="editCode(key)"><Edit /></el-icon>
            </el-tooltip>
            <slot name="code-block-panel-tool" :id="key"></slot>
          </div>
        </div>
      </div>
    </div>

    <!-- 代码块编辑区 -->
    <code-block-editor :id="codeId">
      <template #code-block-edit-panel-header="{ id }">
        <slot name="code-block-edit-panel-header" :id="id"></slot>
      </template>
    </code-block-editor>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import { Edit } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import type { CodeBlockContent, Services } from '../../../type';

import codeBlockEditor from './CodeBlockEditor.vue';

const services = inject<Services>('services');
const codeId = ref('');

// 代码块列表
const codeList = computed(() => services?.codeBlockService.getCodeDsl());

// 新增代码块
const createCodeBlock = () => {
  const { codeBlockService } = services || {};
  if (!codeBlockService) {
    ElMessage.error('新增代码块失败');
    return;
  }
  codeId.value = codeBlockService.getUniqueId();
  const codeConfig: CodeBlockContent = {
    name: '代码块',
    content: `() => {\n  // place your code here\n}`,
  };
  codeBlockService.setCodeDslById(codeId.value, codeConfig);
  codeBlockService.setCodeEditorShowStatus(true);
};

// 编辑代码块
const editCode = (key: string) => {
  codeId.value = key;
  services?.codeBlockService.setCodeEditorShowStatus(true);
};
</script>
