<template>
  <TMagicScrollbar class="m-editor-code-block-list">
    <slot name="code-block-panel-header">
      <div class="code-header-wrapper">
        <SearchInput @search="filterTextChangeHandler"></SearchInput>
        <TMagicButton class="create-code-button" type="primary" size="small" @click="createCodeBlock" v-if="editable"
          >新增</TMagicButton
        >
      </div>
    </slot>

    <!-- 代码块列表 -->
    <TMagicTree
      ref="tree"
      class="magic-editor-layer-tree"
      node-key="id"
      empty-text="暂无代码块"
      default-expand-all
      :expand-on-click-node="false"
      :data="codeList"
      :highlight-current="true"
      :filter-node-method="filterNode"
      @node-click="clickHandler"
    >
      <template #default="{ data }">
        <div :id="data.id" class="list-container">
          <div class="list-item">
            <span class="code-name">{{ data.name }}（{{ data.id }}）</span>
            <!-- 右侧工具栏 -->
            <div class="right-tool" v-if="data.type === 'code'">
              <TMagicTooltip effect="dark" :content="editable ? '编辑' : '查看'" placement="bottom">
                <Icon :icon="editable ? Edit : View" class="edit-icon" @click.stop="editCode(`${data.id}`)"></Icon>
              </TMagicTooltip>
              <TMagicTooltip effect="dark" content="删除" placement="bottom" v-if="editable">
                <Icon :icon="Close" class="edit-icon" @click.stop="deleteCode(`${data.id}`)"></Icon>
              </TMagicTooltip>
              <slot name="code-block-panel-tool" :id="data.id" :data="data.codeBlockContent"></slot>
            </div>
          </div>
        </div>
      </template>
    </TMagicTree>

    <!-- 代码块编辑区 -->
    <CodeBlockEditor v-if="isShowCodeBlockEditor" :paramsColConfig="paramsColConfig">
      <template #code-block-edit-panel-header="{ id }">
        <slot name="code-block-edit-panel-header" :id="id"></slot>
      </template>
    </CodeBlockEditor>
  </TMagicScrollbar>
</template>

<script setup lang="ts" name="MEditorCodeBlockList">
import { computed, inject, ref } from 'vue';
import { Close, Edit, View } from '@element-plus/icons-vue';

import { TMagicButton, tMagicMessage, TMagicScrollbar, TMagicTooltip, TMagicTree } from '@tmagic/design';
import { ColumnConfig } from '@tmagic/form';
import { CodeBlockContent, Id } from '@tmagic/schema';

import Icon from '@editor/components/Icon.vue';
import SearchInput from '@editor/components/SearchInput.vue';
import { CodeDeleteErrorType, CodeDslItem, Services } from '@editor/type';

import CodeBlockEditor from './CodeBlockEditor.vue';

const props = defineProps<{
  customError?: (id: Id, errorType: CodeDeleteErrorType) => any;
  paramsColConfig?: ColumnConfig;
}>();

const { codeBlockService, depService, editorService } = inject<Services>('services') || {};

// 代码块列表
const codeList = computed(() =>
  Object.values(depService?.targets['code-block'] || {}).map((target) => ({
    id: target.id,
    name: target.name,
    type: 'code',
    codeBlockContent: codeBlockService?.getCodeContentById(target.id),
    children: Object.entries(target.deps).map(([id, dep]) => ({
      name: dep.name,
      type: 'node',
      id,
      children: dep.keys.map((key) => ({ name: key, id: key, type: 'key' })),
    })),
  })),
);

const editable = computed(() => codeBlockService?.getEditStatus());

// 是否展示代码编辑区
const isShowCodeBlockEditor = computed(() => codeBlockService?.getCodeEditorShowStatus() || false);

// 新增代码块
const createCodeBlock = async () => {
  if (!codeBlockService) {
    tMagicMessage.error('新增代码块失败');
    return;
  }

  const codeConfig: CodeBlockContent = {
    name: '代码块',
    content: `({app, params}) => {\n  // place your code here\n}`,
    params: [],
  };

  const id = await codeBlockService.getUniqueId();

  await codeBlockService.setCodeDslById(id, codeConfig);
  codeBlockService.setCodeEditorContent(true, id);
};

// 编辑代码块
const editCode = async (key: Id) => {
  codeBlockService?.setCodeEditorContent(true, key);
};

// 删除代码块
const deleteCode = (key: Id) => {
  const currentCode = codeList.value.find((codeItem) => codeItem.id === key);
  const existBinds = Boolean(currentCode?.children.length);
  const undeleteableList = codeBlockService?.getUndeletableList() || [];
  if (!existBinds && !undeleteableList.includes(key)) {
    // 无绑定关系，且不在不可删除列表中
    codeBlockService?.deleteCodeDslByIds([key]);
  } else {
    if (typeof props.customError === 'function') {
      props.customError(key, existBinds ? CodeDeleteErrorType.BIND : CodeDeleteErrorType.UNDELETEABLE);
    } else {
      tMagicMessage.error('代码块删除失败');
    }
  }
};

const tree = ref<InstanceType<typeof TMagicTree>>();

const filterNode = (value: string, data: CodeDslItem): boolean => {
  if (!value) {
    return true;
  }
  return `${data.name}${data.id}`.toLocaleLowerCase().indexOf(value.toLocaleLowerCase()) !== -1;
};

const filterTextChangeHandler = (val: string) => {
  tree.value?.filter(val);
};

// 选中组件
const selectComp = (compId: Id) => {
  const stage = editorService?.get('stage');
  editorService?.select(compId);
  stage?.select(compId);
};

const clickHandler = (data: any, node: any) => {
  if (data.type === 'node') {
    selectComp(data.id);
  } else if (data.type === 'key') {
    selectComp(node.parent.data.id);
  }
};
</script>
