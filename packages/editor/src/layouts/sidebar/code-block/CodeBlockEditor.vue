<template>
  <TMagicDialog
    :model-value="true"
    class="code-editor-dialog"
    :title="currentTitle"
    :fullscreen="true"
    :before-close="close"
    :append-to-body="true"
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
          <TMagicCard shadow="never">
            <template #header>
              <div class="code-name-wrapper">
                <div class="code-name-label">代码块名称</div>
                <TMagicInput
                  v-if="codeConfig"
                  class="code-name-input"
                  v-model="codeConfig.name"
                  :disabled="!editable"
                />
              </div>
            </template>
            <div class="m-editor-wrapper">
              <MagicCodeEditor
                v-if="codeConfig"
                ref="codeEditor"
                class="m-editor-container"
                :init-values="`${codeConfig.content}`"
                @save="saveCodeDraft"
                :options="{
                  tabSize: 2,
                  fontSize: 16,
                  formatOnPaste: true,
                  readOnly: !editable,
                }"
              ></MagicCodeEditor>
              <div class="m-editor-content-bottom" v-if="editable">
                <TMagicButton type="primary" class="button" @click="saveCode">保存</TMagicButton>
                <TMagicButton type="primary" class="button" @click="close">关闭</TMagicButton>
              </div>
              <div class="m-editor-content-bottom" v-else>
                <TMagicButton type="primary" class="button" @click="close">关闭</TMagicButton>
              </div>
            </div>
          </TMagicCard>
        </div>
      </template>
    </Layout>
  </TMagicDialog>
</template>

<script lang="ts" setup name="MEditorCodeBlockEditor">
import { computed, inject, reactive, ref, watchEffect } from 'vue';
import { cloneDeep, forIn, isEmpty } from 'lodash-es';
import type * as monaco from 'monaco-editor';

import {
  TMagicButton,
  TMagicCard,
  TMagicDialog,
  TMagicInput,
  tMagicMessage,
  tMagicMessageBox,
  TMagicTree,
} from '@tmagic/design';
import { datetimeFormatter } from '@tmagic/utils';

import Layout from '../../../components/Layout.vue';
import type { CodeBlockContent, CodeDslList, ListState, Services } from '../../../type';
import { CodeEditorMode } from '../../../type';
import { serializeConfig } from '../../../utils/editor';
import MagicCodeEditor from '../../CodeEditor.vue';

const services = inject<Services>('services');

const codeEditor = ref<InstanceType<typeof MagicCodeEditor>>();
const left = ref(200);
const currentTitle = ref('');
// 编辑器当前需展示的代码块内容
const codeConfig = ref<CodeBlockContent | null>(null);
// 原始代码内容
const originCodeContent = ref<string | null>(null);
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
  if (!originCodeContent.value) {
    // 暂存原始的代码内容
    originCodeContent.value = serializeConfig(codeConfig.value.content);
  }
  // 有草稿时展示上次保存的草稿内容
  const codeDraft = services?.codeBlockService.getCodeDraft(id.value);
  if (codeDraft) {
    codeConfig.value.content = codeDraft;
  }
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

// 保存草稿
const saveCodeDraft = (codeValue: string) => {
  if (!codeEditor.value) return;
  if (originCodeContent.value === codeValue) {
    // 没修改或改回原样 有草稿的话删除草稿
    services?.codeBlockService.removeCodeDraft(id.value);
    return;
  }
  services?.codeBlockService.setCodeDraft(id.value, codeValue);
  tMagicMessage.success(`代码草稿保存成功 ${datetimeFormatter(new Date())}`);
};

// 保存代码
const saveCode = async (): Promise<boolean> => {
  if (!codeEditor.value || !codeConfig.value || !editable.value) return true;

  try {
    // 代码内容
    const codeContent = (codeEditor.value.getEditor() as monaco.editor.IStandaloneCodeEditor)?.getValue();
    /* eslint no-eval: "off" */
    codeConfig.value.content = eval(codeContent);
  } catch (e: any) {
    tMagicMessage.error(e.stack);
    return false;
  }
  // 存入dsl
  await services?.codeBlockService.setCodeDslById(id.value, {
    name: codeConfig.value.name,
    content: codeConfig.value.content,
  });
  tMagicMessage.success('代码保存成功');
  // 删除草稿
  services?.codeBlockService.removeCodeDraft(id.value);
  return true;
};

// 关闭弹窗
const close = async () => {
  const codeDraft = services?.codeBlockService.getCodeDraft(id.value);
  let shouldClose = true;
  if (codeDraft) {
    await tMagicMessageBox
      .confirm('您有代码修改未保存，是否保存后再关闭？', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      })
      .then(async () => {
        // 保存之后再关闭
        shouldClose = await saveCode();
      })
      .catch(() => {
        // 删除草稿 直接关闭
        services?.codeBlockService.removeCodeDraft(id.value);
      });
  }
  if (shouldClose) {
    services?.codeBlockService.setCodeEditorShowStatus(false);
  }
};

const selectHandler = (data: CodeDslList) => {
  services?.codeBlockService.setId(data.id);
  currentTitle.value = data.name;
};
</script>
