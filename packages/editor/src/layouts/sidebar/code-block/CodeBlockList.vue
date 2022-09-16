<template>
  <div class="m-editor-code-block-list">
    <slot name="code-block-panel-header">
      <div class="create-code-button">
        <el-button type="primary" size="small" @click="createCodeBlock" :disabled="!editable">新增代码块</el-button>
      </div>
      <el-divider class="divider" />
    </slot>

    <!-- 代码块列表 -->
    <el-tree
      v-if="!isEmpty(state.codeList)"
      ref="tree"
      node-key="id"
      empty-text="暂无代码块"
      :data="state.codeList"
      :highlight-current="true"
    >
      <template #default="{ data }">
        <div :id="data.id" class="list-container">
          <div class="list-item">
            <div class="code-name">{{ data.name }}（{{ data.id }}）</div>
            <div class="right-tool">
              <el-tooltip effect="dark" :content="editable ? '编辑' : '查看'" placement="top">
                <Icon :icon="editable ? Edit : View" class="edit-icon" @click="editCode(`${data.id}`)"></Icon>
              </el-tooltip>
              <el-tooltip effect="dark" content="删除" placement="top" v-if="editable">
                <Icon :icon="Close" class="edit-icon" @click="deleteCode(`${data.id}`)"></Icon>
              </el-tooltip>
              <slot name="code-block-panel-tool" :id="data.id"></slot>
            </div>
          </div>
        </div>
      </template>
    </el-tree>

    <!-- 代码块编辑区 -->
    <code-block-editor>
      <template #code-block-edit-panel-header="{ id }">
        <slot name="code-block-edit-panel-header" :id="id"></slot>
      </template>
    </code-block-editor>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, reactive, watchEffect } from 'vue';
import { Close, Edit, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { flattenDeep, forIn, isEmpty, values } from 'lodash-es';

import Icon from '../../../components/Icon.vue';
import type { CodeBlockContent, Services } from '../../../type';
import { EditorMode, ListState } from '../../../type';

import codeBlockEditor from './CodeBlockEditor.vue';

enum ErrorType {
  UNDELETEABLE = 'undeleteable',
  BIND = 'bind',
}

const props = defineProps<{
  customError?: (id: string, errorType: ErrorType) => any;
}>();

const services = inject<Services>('services');
// 代码块列表
const state = reactive<ListState>({
  codeList: [],
});

const editable = computed(() => services?.codeBlockService.getEditStatus());

watchEffect(async () => {
  const codeDsl = (await services?.codeBlockService.getCodeDsl()) || null;
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

// 新增代码块
const createCodeBlock = async () => {
  const { codeBlockService } = services || {};
  if (!codeBlockService) {
    ElMessage.error('新增代码块失败');
    return;
  }
  const codeConfig: CodeBlockContent = {
    name: '代码块',
    content: `() => {\n  // place your code here\n}`,
  };
  await codeBlockService.setMode(EditorMode.EDITOR);
  const id = await codeBlockService.getUniqueId();
  await codeBlockService.setCodeDslById(id, codeConfig);
  codeBlockService.setCodeEditorContent(true, id);
};

// 编辑代码块
const editCode = async (key: string) => {
  await services?.codeBlockService.setMode(EditorMode.EDITOR);
  services?.codeBlockService.setCodeEditorContent(true, key);
};

// 删除代码块
const deleteCode = (key: string) => {
  const compRelation = services?.codeBlockService.getCompRelation();
  const codeIds = flattenDeep(values(compRelation));
  const undeleteableList = services?.codeBlockService.getUndeletableList() || [];
  if (!codeIds.includes(key) && !undeleteableList.includes(key)) {
    // 无绑定关系，且不在不可删除列表中
    services?.codeBlockService.deleteCodeDslByIds([key]);
  } else {
    if (typeof props.customError === 'function') {
      props.customError(key, codeIds.includes(key) ? ErrorType.BIND : ErrorType.UNDELETEABLE);
    } else {
      ElMessage.error('代码块删除失败');
    }
  }
};
</script>
