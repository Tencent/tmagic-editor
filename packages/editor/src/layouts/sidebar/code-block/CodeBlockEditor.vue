<template>
  <el-dialog
    v-model="isShowCodeBlockEditor"
    :fullscreen="true"
    :before-close="saveAndClose"
    :append-to-body="true"
    custom-class="code-editor-dialog"
  >
    <!-- 左侧列表 -->
    <template v-if="mode === EditorMode.LIST">
      <el-card class="code-editor-side-menu">
        <el-tree
          v-if="!isEmpty(state.codeList)"
          ref="tree"
          node-key="id"
          empty-text="暂无代码块"
          :data="state.codeList"
          :highlight-current="true"
          @node-click="selectHandler"
          :current-node-key="state.codeList[0].id"
          class="side-tree"
        >
          <template #default="{ data }">
            <div :id="data.id" class="list-container">
              <div class="list-item">
                <div class="code-name">{{ data.name }}（{{ data.id }}）</div>
              </div>
            </div>
          </template>
        </el-tree>
      </el-card>
    </template>
    <!-- 右侧区域 -->
    <div
      v-if="!isEmpty(codeConfig)"
      :class="[
        mode === EditorMode.LIST ? 'm-editor-code-block-editor-panel-list-mode' : 'm-editor-code-block-editor-panel',
      ]"
    >
      <slot name="code-block-edit-panel-header" :id="id"></slot>
      <el-card shadow="never">
        <template #header>
          <div class="code-name-wrapper">
            <div class="code-name-label">代码块名称</div>
            <el-input class="code-name-input" size="small" v-model="codeConfig.name" :disabled="!editable" />
          </div>
        </template>
        <div class="m-editor-wrapper">
          <magic-code-editor
            ref="codeEditor"
            class="m-editor-container"
            :init-values="`${codeConfig.content}`"
            @save="saveCode"
            :options="{
              tabSize: 2,
              fontSize: 16,
              formatOnPaste: true,
              readOnly: !editable,
            }"
          ></magic-code-editor>
          <div class="m-editor-content-bottom" v-if="editable">
            <el-button type="primary" class="button" @click="saveCode">保存</el-button>
            <el-button type="primary" class="button" @click="saveAndClose">关闭</el-button>
          </div>
          <div class="m-editor-content-bottom" v-else>
            <el-button type="primary" class="button" @click="saveAndClose">关闭</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, inject, reactive, ref, watchEffect } from 'vue';
import { ElMessage } from 'element-plus';
import { forIn, isEmpty } from 'lodash-es';

import type { CodeBlockContent, CodeDslList, ListState, Services } from '../../../type';
import { EditorMode } from '../../../type';

const services = inject<Services>('services');

const codeEditor = ref<any | null>(null);
// 编辑器当前需展示的代码块内容
const codeConfig = ref<CodeBlockContent | null>(null);
// select选择的内容(ListState)
const state = reactive<ListState>({
  codeList: [],
});

// 是否展示代码编辑区
const isShowCodeBlockEditor = computed(
  () => (codeConfig.value && services?.codeBlockService.getCodeEditorShowStatus()) || false,
);
const mode = computed(() => services?.codeBlockService.getMode());
const id = computed(() => services?.codeBlockService.getId() || '');
const editable = computed(() => services?.codeBlockService.getEditStatus());
// 当前选中组件绑定的代码块id数组
const selectedIds = computed(() => services?.codeBlockService.getCombineIds() || []);

watchEffect(async () => {
  codeConfig.value = (await services?.codeBlockService.getCodeContentById(id.value)) ?? null;
});

watchEffect(async () => {
  const codeDsl = (await services?.codeBlockService.getCodeDslByIds(selectedIds.value)) || null;
  if (!codeDsl) return;
  state.codeList = [];
  forIn(codeDsl, (value: CodeBlockContent, key: string) => {
    state.codeList.push({
      id: key,
      name: value.name,
      content: value.content,
    });
  });
});

// 保存代码
const saveCode = async (): Promise<boolean> => {
  if (!codeEditor.value || !codeConfig.value || !editable.value) return true;

  try {
    // 代码内容
    const codeContent = codeEditor.value.getEditor().getValue();
    /* eslint no-eval: "off" */
    codeConfig.value.content = eval(codeContent);
  } catch (e: any) {
    ElMessage.error(e.stack);
    return false;
  }
  // 存入dsl
  await services?.codeBlockService.setCodeDslById(id.value, {
    name: codeConfig.value.name,
    content: codeConfig.value.content,
  });
  ElMessage.success('代码保存成功');
  return true;
};

// 保存并关闭
const saveAndClose = async () => {
  const saveRes = await saveCode();
  if (saveRes) {
    await services?.codeBlockService.setCodeEditorShowStatus(false);
  }
};

const selectHandler = (data: CodeDslList) => {
  services?.codeBlockService.setId(data.id);
};
</script>
