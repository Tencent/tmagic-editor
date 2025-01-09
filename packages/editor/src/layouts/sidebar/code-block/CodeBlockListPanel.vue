<template>
  <TMagicScrollbar class="m-editor-code-block-list m-editor-layer-panel">
    <slot name="code-block-panel-header">
      <div class="search-wrapper">
        <SearchInput @search="filterTextChangeHandler"></SearchInput>
        <TMagicButton v-if="editable" class="create-code-button" type="primary" size="small" @click="createCodeBlock"
          >新增</TMagicButton
        >
        <slot name="code-block-panel-search"></slot>
      </div>
    </slot>

    <!-- 代码块列表 -->
    <CodeBlockList
      ref="codeBlockList"
      :custom-error="customError"
      :indent="indent"
      :next-level-indent-increment="nextLevelIndentIncrement"
      @edit="editCode"
      @remove="deleteCode"
      @node-contextmenu="nodeContentMenuHandler"
    >
      <template #code-block-panel-tool="{ id, data }">
        <slot name="code-block-panel-tool" :id="id" :data="data"></slot>
      </template>
    </CodeBlockList>
  </TMagicScrollbar>

  <CodeBlockEditor
    v-if="codeConfig"
    ref="codeBlockEditor"
    :disabled="!editable"
    :content="codeConfig"
    @submit="submitCodeBlockHandler"
  ></CodeBlockEditor>

  <Teleport to="body">
    <ContentMenu
      v-if="menuData.length"
      :menu-data="menuData"
      ref="menu"
      style="overflow: initial"
      @hide="contentMenuHideHandler"
    ></ContentMenu>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject, useTemplateRef } from 'vue';

import type { Id } from '@tmagic/core';
import { TMagicButton, TMagicScrollbar } from '@tmagic/design';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import ContentMenu from '@editor/components/ContentMenu.vue';
import SearchInput from '@editor/components/SearchInput.vue';
import { useCodeBlockEdit } from '@editor/hooks/use-code-block-edit';
import type {
  CodeBlockListPanelSlots,
  CodeDeleteErrorType,
  CustomContentMenuFunction,
  EventBus,
  MenuButton,
  MenuComponent,
  Services,
} from '@editor/type';

import CodeBlockList from './CodeBlockList.vue';
import { useContentMenu } from './useContentMenu';

defineSlots<CodeBlockListPanelSlots>();

defineOptions({
  name: 'MEditorCodeBlockListPanel',
});

const props = defineProps<{
  indent?: number;
  nextLevelIndentIncrement?: number;
  customError?: (id: Id, errorType: CodeDeleteErrorType) => any;
  customContentMenu: CustomContentMenuFunction;
}>();

const eventBus = inject<EventBus>('eventBus');
const { codeBlockService } = inject<Services>('services') || {};

const editable = computed(() => codeBlockService?.getEditStatus());

const { codeBlockEditor, codeConfig, editCode, deleteCode, createCodeBlock, submitCodeBlockHandler } =
  useCodeBlockEdit(codeBlockService);

const codeBlockListRef = useTemplateRef<InstanceType<typeof CodeBlockList>>('codeBlockList');

const filterTextChangeHandler = (val: string) => {
  codeBlockListRef.value?.filter(val);
};

eventBus?.on('edit-code', (id: string) => {
  editCode(id);
});

const {
  nodeContentMenuHandler,
  menuData: contentMenuData,
  contentMenuHideHandler,
} = useContentMenu((id: string) => {
  codeBlockListRef.value?.deleteCode(id);
});
const menuData = computed<(MenuButton | MenuComponent)[]>(() => props.customContentMenu(contentMenuData, 'code-block'));
</script>
