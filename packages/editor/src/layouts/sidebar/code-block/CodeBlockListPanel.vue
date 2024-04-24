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
    <CodeBlockList ref="codeBlockList" :custom-error="customError" @edit="editCode" @remove="deleteCode">
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
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';

import { TMagicButton, TMagicScrollbar } from '@tmagic/design';
import type { Id } from '@tmagic/schema';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import SearchInput from '@editor/components/SearchInput.vue';
import { useCodeBlockEdit } from '@editor/hooks/use-code-block-edit';
import type { CodeBlockListPanelSlots, CodeDeleteErrorType, EventBus, Services } from '@editor/type';

import CodeBlockList from './CodeBlockList.vue';

defineSlots<CodeBlockListPanelSlots>();

defineOptions({
  name: 'MEditorCodeBlockListPanel',
});

defineProps<{
  customError?: (id: Id, errorType: CodeDeleteErrorType) => any;
}>();

const eventBus = inject<EventBus>('eventBus');
const { codeBlockService } = inject<Services>('services') || {};

const editable = computed(() => codeBlockService?.getEditStatus());

const { codeBlockEditor, codeConfig, editCode, deleteCode, createCodeBlock, submitCodeBlockHandler } =
  useCodeBlockEdit(codeBlockService);

const codeBlockList = ref<InstanceType<typeof CodeBlockList>>();

const filterTextChangeHandler = (val: string) => {
  codeBlockList.value?.filter(val);
};

eventBus?.on('edit-code', (id: string) => {
  editCode(id);
});
</script>
