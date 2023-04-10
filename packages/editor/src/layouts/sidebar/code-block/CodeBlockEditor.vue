<template>
  <TMagicDrawer
    class="code-editor-dialog"
    :model-value="true"
    :title="currentTitle"
    :close-on-press-escape="false"
    :append-to-body="true"
    :show-close="false"
    :close-on-click-modal="false"
    :size="size"
  >
    <Layout v-model:left="left" :min-left="45" class="code-editor-layout">
      <!-- 右侧区域 -->
      <template #center>
        <div v-if="!isEmpty(codeConfig)" class="m-editor-code-block-editor-panel">
          <slot name="code-block-edit-panel-header" :id="id"></slot>
          <FunctionEditor
            v-if="codeConfig"
            :id="id"
            :name="codeConfig.name"
            :content="codeConfig.content"
            :paramsColConfig="paramsColConfig"
            :editable="!!editable"
            :autoSaveDraft="true"
            :codeOptions="codeOptions"
          ></FunctionEditor>
        </div>
      </template>
    </Layout>
  </TMagicDrawer>
</template>

<script lang="ts" setup name="MEditorCodeBlockEditor">
import { computed, inject, reactive, ref, watchEffect } from 'vue';
import { cloneDeep, forIn, isEmpty } from 'lodash-es';

import { TMagicDrawer } from '@tmagic/design';
import { ColumnConfig } from '@tmagic/form';
import { CodeBlockContent } from '@tmagic/schema';

import FunctionEditor from '@editor/components/FunctionEditor.vue';
import Layout from '@editor/components/Layout.vue';
import type { ListState, Services } from '@editor/type';
import { serializeConfig } from '@editor/utils/editor';

const services = inject<Services>('services');
const codeOptions = inject('codeOptions', {});

defineProps<{
  paramsColConfig?: ColumnConfig;
}>();

const size = computed(() => globalThis.document.body.clientWidth - (services?.uiService.get('columnWidth').left || 0));

const left = ref(200);
const currentTitle = ref('');
// 编辑器当前需展示的代码块内容
const codeConfig = ref<CodeBlockContent | null>(null);
// select选择的内容(ListState)
const state = reactive<ListState>({
  codeList: [],
});

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
</script>
