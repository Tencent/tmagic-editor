<template>
  <TMagicScrollbar class="m-editor-code-block-list m-editor-layer-panel">
    <slot name="code-block-panel-header">
      <div class="search-wrapper">
        <SearchInput @search="filterTextChangeHandler"></SearchInput>
        <TMagicButton v-if="editable" class="create-code-button" type="primary" size="small" @click="showCreate"
          >新增</TMagicButton
        >
        <slot name="code-block-panel-search"></slot>
      </div>
    </slot>

    <!-- 代码块列表 -->
    <CodeBlockList ref="codeBlockList" :custom-error="customError" @edit="showEdit" @remove="deleteCode">
      <template #code-block-panel-tool="{ id, data }">
        <slot name="code-block-panel-tool" :id="id" :data="data"></slot>
      </template>
    </CodeBlockList>
  </TMagicScrollbar>

  <!-- 代码块编辑区 -->
  <FloatingBox v-model:visible="popVisible" title="代码编辑" :position="boxPosition">
    <template #body>
      <div ref="scrollBar"></div>
    </template>
  </FloatingBox>

  <Teleport :to="scrollBar" :disabled="slideType === 'box'" v-if="editVisible">
    <CodeBlockEditor
      v-if="codeConfig"
      ref="codeBlockEditor"
      :disabled="!editable"
      :content="codeConfig"
      @submit="submitCodeBlockHandler"
    ></CodeBlockEditor>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref } from 'vue';

import { TMagicButton, TMagicScrollbar } from '@tmagic/design';
import type { Id } from '@tmagic/schema';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import FloatingBox from '@editor/components/FloatingBox.vue';
import SearchInput from '@editor/components/SearchInput.vue';
import { useCodeBlockEdit } from '@editor/hooks/use-code-block-edit';
import type { CodeBlockListPanelSlots, CodeDeleteErrorType, Services, SlideType } from '@editor/type';

import CodeBlockList from './CodeBlockList.vue';

defineSlots<CodeBlockListPanelSlots>();

defineOptions({
  name: 'MEditorCodeBlockListPanel',
});

const props = defineProps<{
  customError?: (id: Id, errorType: CodeDeleteErrorType) => any;
  slideType?: SlideType;
}>();

const { codeBlockService, uiService } = inject<Services>('services') || {};

const editable = computed(() => codeBlockService?.getEditStatus());

const { codeBlockEditor, codeConfig, editCode, deleteCode, createCodeBlock, submitCodeBlockHandler } =
  useCodeBlockEdit(codeBlockService);

const codeBlockList = ref<InstanceType<typeof CodeBlockList>>();

const filterTextChangeHandler = (val: string) => {
  codeBlockList.value?.filter(val);
};

const boxPosition = computed(() => {
  const columnWidth = uiService?.get('columnWidth');
  const navMenuRect = uiService?.get('navMenuRect');
  return {
    left: columnWidth?.left ?? 0,
    top: (navMenuRect?.top ?? 0) + (navMenuRect?.height ?? 0),
  };
});

const scrollBar = ref<HTMLDivElement>();
const popVisible = ref<boolean>(false);
const editVisible = ref<boolean>(false);

const beforeShowEdit = async () => {
  if (props.slideType !== 'box') {
    popVisible.value = true;
  }
  await nextTick();
  editVisible.value = true;
};

const showEdit = async (id: string) => {
  await beforeShowEdit();
  editCode(id);
};

const showCreate = async () => {
  await beforeShowEdit();
  createCodeBlock();
};
</script>
