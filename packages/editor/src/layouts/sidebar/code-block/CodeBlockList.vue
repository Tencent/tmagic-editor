<template>
  <div class="m-editor-code-block-list">
    <slot name="code-block-panel-header">
      <div class="code-header-wrapper">
        <TMagicInput
          :class="[editable ? 'code-filter-input' : 'code-filter-input-no-btn']"
          size="small"
          placeholder="输入关键字进行过滤"
          clearable
          v-model="filterText"
          @input="filterTextChangeHandler"
        ></TMagicInput>
        <TMagicButton class="create-code-button" type="primary" size="small" @click="createCodeBlock" v-if="editable"
          >新增</TMagicButton
        >
      </div>
    </slot>

    <!-- 代码块列表 -->
    <TMagicScrollbar>
      <TMagicTree
        v-if="!isEmpty(state.codeList)"
        ref="tree"
        node-key="id"
        empty-text="暂无代码块"
        :data="state.codeList"
        :highlight-current="true"
        :filter-node-method="filterNode"
        @node-click="toggleCombineRelation"
      >
        <template #default="{ data }">
          <div :id="data.id" class="list-container">
            <div class="list-item">
              <span class="code-name">{{ data.name }}（{{ data.id }}）</span>
              <!-- 右侧工具栏 -->
              <div class="right-tool">
                <TMagicTooltip effect="dark" :content="editable ? '编辑' : '查看'" placement="bottom">
                  <Icon :icon="editable ? Edit : View" class="edit-icon" @click.stop="editCode(`${data.id}`)"></Icon>
                </TMagicTooltip>
                <TMagicTooltip
                  effect="dark"
                  content="查看绑定关系"
                  placement="bottom"
                  v-if="data.combineInfo && data.combineInfo.length > 0"
                >
                  <Icon :icon="Link" class="edit-icon" @click.stop="toggleCombineRelation(data)"></Icon>
                </TMagicTooltip>
                <TMagicTooltip effect="dark" content="删除" placement="bottom" v-if="editable">
                  <Icon :icon="Close" class="edit-icon" @click.stop="deleteCode(`${data.id}`)"></Icon>
                </TMagicTooltip>
                <slot name="code-block-panel-tool" :id="data.id" :data="data.codeBlockContent"></slot>
              </div>
            </div>
            <!-- 展示代码块下绑定的组件 -->
            <div
              class="code-comp-map-wrapper"
              v-if="data.showRelation && data.combineInfo && data.combineInfo.length > 0"
            >
              <svg class="arrow-left" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-029747aa="">
                <path
                  fill="currentColor"
                  d="M609.408 149.376 277.76 489.6a32 32 0 0 0 0 44.672l331.648 340.352a29.12 29.12 0 0 0 41.728 0 30.592 30.592 0 0 0 0-42.752L339.264 511.936l311.872-319.872a30.592 30.592 0 0 0 0-42.688 29.12 29.12 0 0 0-41.728 0z"
                ></path>
              </svg>
              <TMagicButton
                v-for="(comp, index) in data.combineInfo"
                :key="index"
                class="code-comp"
                size="small"
                :plain="true"
                @click.stop="selectComp(comp.compId)"
                >{{ comp.compName }}</TMagicButton
              >
            </div>
          </div>
        </template>
      </TMagicTree>
    </TMagicScrollbar>

    <!-- 代码块编辑区 -->
    <code-block-editor v-if="isShowCodeBlockEditor" :paramsColConfig="paramsColConfig">
      <template #code-block-edit-panel-header="{ id }">
        <slot name="code-block-edit-panel-header" :id="id"></slot>
      </template>
    </code-block-editor>
  </div>
</template>

<script lang="ts" setup name="MEditorCodeBlockList">
import { computed, inject, reactive, ref, watch } from 'vue';
import { Close, Edit, Link, View } from '@element-plus/icons-vue';
import { cloneDeep, forIn, isEmpty } from 'lodash-es';

import { TMagicButton, TMagicInput, tMagicMessage, TMagicScrollbar, TMagicTooltip, TMagicTree } from '@tmagic/design';
import { ColumnConfig } from '@tmagic/form';
import { CodeBlockContent, Id } from '@tmagic/schema';

import Icon from '../../../components/Icon.vue';
import type { CodeRelation, CombineInfo, Services } from '../../../type';
import { CodeDeleteErrorType, CodeDslItem, ListState } from '../../../type';

import codeBlockEditor from './CodeBlockEditor.vue';

const props = defineProps<{
  customError?: (id: Id, errorType: CodeDeleteErrorType) => any;
  paramsColConfig?: ColumnConfig;
}>();

const services = inject<Services>('services');

// 代码块列表
const state = reactive<ListState>({
  codeList: [],
});

const editable = computed(() => services?.codeBlockService.getEditStatus());

// 是否展示代码编辑区
const isShowCodeBlockEditor = computed(() => services?.codeBlockService.getCodeEditorShowStatus() || false);
// 获取绑定关系
const codeCombineInfo = ref<CodeRelation | null>(null);

// 根据代码块ID获取其绑定的组件信息
const getBindCompsByCodeId = (codeId: Id): CombineInfo[] => {
  if (!codeCombineInfo.value) return [];
  const bindsComp = [] as CombineInfo[];
  forIn(codeCombineInfo.value, (codeIds, compId) => {
    if (codeIds.includes(codeId)) {
      bindsComp.push({
        compId,
        compName: getCompName(compId),
      });
    }
  });
  return bindsComp as CombineInfo[];
};

// 更新代码块列表
const refreshCodeList = async () => {
  const codeDsl = cloneDeep(await services?.codeBlockService.getCodeDsl()) || null;
  codeCombineInfo.value = cloneDeep(services?.codeBlockService.getCombineInfo()) || null;
  if (!codeDsl || !codeCombineInfo.value) return;
  state.codeList = [];
  forIn(codeDsl, (value: CodeBlockContent, codeId: Id) => {
    state.codeList.push({
      id: codeId,
      name: value.name,
      codeBlockContent: value,
      showRelation: true,
      combineInfo: getBindCompsByCodeId(codeId),
    });
  });
};

watch(
  () => services?.editorService.get('root'),
  () => {
    services?.codeBlockService.refreshAllRelations();
    refreshCodeList();
  },
  {
    immediate: true,
  },
);

watch(
  [() => services?.codeBlockService.getCodeDslSync(), () => services?.codeBlockService.getCombineInfo()],
  () => {
    refreshCodeList();
  },
  {
    deep: true,
  },
);

// 新增代码块
const createCodeBlock = async () => {
  const { codeBlockService } = services || {};
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
  services?.codeBlockService.setCodeEditorContent(true, key);
};

// 删除代码块
const deleteCode = (key: Id) => {
  const currentCode = state.codeList.find((codeItem: CodeDslItem) => codeItem.id === key);
  const existBinds = !isEmpty(currentCode?.combineInfo);
  const undeleteableList = services?.codeBlockService.getUndeletableList() || [];
  if (!existBinds && !undeleteableList.includes(key)) {
    // 无绑定关系，且不在不可删除列表中
    services?.codeBlockService.deleteCodeDslByIds([key]);
  } else {
    if (typeof props.customError === 'function') {
      props.customError(key, existBinds ? CodeDeleteErrorType.BIND : CodeDeleteErrorType.UNDELETEABLE);
    } else {
      tMagicMessage.error('代码块删除失败');
    }
  }
};

const filterText = ref('');
const tree = ref();

const filterNode = (value: string, data: CodeDslItem): boolean => {
  if (!value) {
    return true;
  }
  return `${data.name}${data.id}`.indexOf(value) !== -1;
};

const filterTextChangeHandler = (val: string) => {
  tree.value?.filter(val);
};

// 展示/隐藏组件绑定关系
const toggleCombineRelation = (data: CodeDslItem) => {
  const { id } = data;
  const currentCode = state.codeList.find((item) => item.id === id);
  if (!currentCode) return;
  currentCode.showRelation = !currentCode?.showRelation;
};

// 获取组件名称展示到tag上
const getCompName = (compId: Id): string => {
  const node = services?.editorService.getNodeById(compId);
  return node?.name || String(compId);
};

// 选中组件
const selectComp = (compId: Id) => {
  const stage = services?.editorService.get('stage');
  services?.editorService.select(compId);
  stage?.select(compId);
};
</script>
