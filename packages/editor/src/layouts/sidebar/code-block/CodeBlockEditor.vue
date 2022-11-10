<template>
  <TMagicDialog
    :model-value="true"
    class="code-editor-dialog"
    :title="currentTitle"
    :fullscreen="true"
    :close-on-press-escape="false"
    :append-to-body="true"
    :show-close="false"
  >
    <Layout v-model:left="left" :min-left="45" class="code-editor-layout">
      <!-- 左侧列表 -->
      <template #left v-if="mode === CodeEditorMode.LIST">
        <TMagicTree
          v-if="!isEmpty(state.codeList)"
          class="side-tree"
          node-key="id"
          empty-text="暂无代码块"
          :data="state.codeList"
          :highlight-current="true"
          :current-node-key="state.codeList[0].id"
          @node-click="selectHandler"
        >
          <template #default="{ data }">
            <div :id="data.id" class="list-container">
              <div class="list-item">
                <div class="code-name">{{ data.name }}（{{ data.id }}）</div>
              </div>
            </div>
          </template>
        </TMagicTree>
      </template>
      <!-- 右侧区域 -->
      <template #center>
        <div
          v-if="!isEmpty(codeConfig)"
          :class="[
            mode === CodeEditorMode.LIST
              ? 'm-editor-code-block-editor-panel-list-mode'
              : 'm-editor-code-block-editor-panel',
          ]"
        >
          <slot name="code-block-edit-panel-header" :id="id"></slot>
          <FunctionEditor
            v-if="codeConfig"
            :id="id"
            :name="codeConfig.name"
            :content="codeConfig.content"
            :editable="!!editable"
            :autoSaveDraft="mode === CodeEditorMode.EDITOR"
            :codeOptions="codeOptions"
          ></FunctionEditor>
        </div>
      </template>
    </Layout>
  </TMagicDialog>
</template>

<script lang="ts" setup name="MEditorCodeBlockEditor">
import { computed, inject, reactive, ref, watchEffect } from 'vue';
import { cloneDeep, forIn, isEmpty } from 'lodash-es';

import { TMagicDialog, TMagicTree } from '@tmagic/design';
import { CodeBlockContent } from '@tmagic/schema';

import FunctionEditor from '../../../components/FunctionEditor.vue';
import Layout from '../../../components/Layout.vue';
import type { CodeDslItem, ListState, Services } from '../../../type';
import { CodeEditorMode } from '../../../type';
import { serializeConfig } from '../../../utils/editor';

const services = inject<Services>('services');
const codeOptions = inject('codeOptions', {});

const left = ref(200);
const currentTitle = ref('');
// 编辑器当前需展示的代码块内容
const codeConfig = ref<CodeBlockContent | null>(null);
// select选择的内容(ListState)
const state = reactive<ListState>({
  codeList: [],
});

const mode = computed(() => services?.codeBlockService.getMode());
const id = computed(() => services?.codeBlockService.getId() || '');
const editable = computed(() => services?.codeBlockService.getEditStatus());
// 当前选中组件绑定的代码块id数组
const selectedIds = computed(() => services?.codeBlockService.getCombineIds() || []);

watchEffect(async () => {
  codeConfig.value = cloneDeep(await services?.codeBlockService.getCodeContentById(id.value)) || null;
  if (!codeConfig.value) return;
  codeConfig.value.content = serializeConfig(codeConfig.value.content);
});

watchEffect(async () => {
  const codeDsl = (await services?.codeBlockService.getCodeDslByIds(selectedIds.value)) || null;
  if (!codeDsl) return;
  state.codeList = [];
  forIn(codeDsl, (value: CodeBlockContent, key: string) => {
    state.codeList.push({
      id: key,
      name: value.name,
    });
  });
  currentTitle.value = state.codeList[0]?.name || '';
});

const selectHandler = (data: CodeDslItem) => {
  services?.codeBlockService.setId(data.id);
  currentTitle.value = data.name;
};
</script>
