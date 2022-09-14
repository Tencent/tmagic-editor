<template>
  <el-dialog
    v-model="isShowCodeBlockEditor"
    title="代码块编辑面板"
    :fullscreen="true"
    :before-close="saveAndClose"
    :append-to-body="true"
    custom-class="code-editor-dialog"
  >
    <template v-if="mode === EditorMode.LIST">
      <el-menu :default-active="selectedIds[0]" class="code-editor-side-menu">
        <el-menu-item v-for="(value, key) in selectedValue" :index="key" :key="key" @click="menuSelectHandler">
          <template #title>{{ value.name }}（{{ key }}）</template>
        </el-menu-item>
      </el-menu>
    </template>
    <div
      v-if="!isEmpty(codeConfig)"
      :class="[
        mode === EditorMode.LIST ? 'm-editor-code-block-editor-panel-list-mode' : '',
        'm-editor-code-block-editor-panel',
      ]"
    >
      <slot name="code-block-edit-panel-header" :id="id"></slot>
      <el-row class="code-name-wrapper" justify="start">
        <el-col :span="3">
          <span>代码块名称</span>
        </el-col>
        <el-col :span="6">
          <el-input size="small" v-model="codeConfig.name" :disabled="!editable" />
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
        <div class="m-editor-content-bottom clearfix" v-if="editable">
          <el-button type="primary" class="button" @click="saveCode">保存</el-button>
          <el-button type="primary" class="button" @click="saveAndClose">保存并关闭</el-button>
        </div>
        <div class="m-editor-content-bottom clearfix" v-else>
          <el-button type="primary" class="button" @click="saveAndClose">关闭</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, inject, ref, watchEffect } from 'vue';
import { ElMessage } from 'element-plus';
import { isEmpty } from 'lodash-es';

import type { CodeBlockContent, CodeBlockDSL, Services } from '../../../type';
import { EditorMode } from '../../../type';

const services = inject<Services>('services');

const codeEditor = ref<any | null>(null);
// 编辑器当前需展示的代码块内容
const codeConfig = ref<CodeBlockContent | null>(null);
// select选择的内容(CodeBlockDSL)
const selectedValue = ref<CodeBlockDSL | null>(null);

// 是否展示代码编辑区
const isShowCodeBlockEditor = computed(() => codeConfig.value && services?.codeBlockService.getCodeEditorShowStatus());
const mode = computed(() => services?.codeBlockService.getMode());
const id = computed(() => services?.codeBlockService.getId() || '');
const editable = computed(() => services?.codeBlockService.getEditStatus());
// 当前选中组件绑定的代码块id数组
const selectedIds = computed(() => services?.codeBlockService.getCombineIds() || []);

watchEffect(async () => {
  codeConfig.value = (await services?.codeBlockService.getCodeContentById(id.value)) ?? null;
});

watchEffect(async () => {
  selectedValue.value = (await services?.codeBlockService.getCodeDslByIds(selectedIds.value)) || null;
});

// 保存代码
const saveCode = async () => {
  if (!codeEditor.value || !codeConfig.value || !editable.value) return;

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
  await services?.codeBlockService.setCodeDslById(id.value, {
    name: codeConfig.value.name,
    content: codeConfig.value.content,
  });
  ElMessage.success('代码保存成功');
};

// 保存并关闭
const saveAndClose = async () => {
  await saveCode();
  await services?.codeBlockService.setCodeEditorShowStatus(false);
};

const menuSelectHandler = (item: any) => {
  services?.codeBlockService.setId(item.index);
};
</script>
