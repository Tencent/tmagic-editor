<template>
  <Tree
    :data="codeList"
    :node-status-map="nodeStatusMap"
    :indent="indent"
    :next-level-indent-increment="nextLevelIndentIncrement"
    @node-click="clickHandler"
    @node-contextmenu="nodeContentMenuHandler"
  >
    <template #tree-node-label="{ data }">
      <div
        :class="{
          code: data.type === 'code',
          hook: data.type === 'key',
          disabled: data.type === 'key' || data.type === 'code',
        }"
      >
        {{ data.name }} {{ data.key ? `(${data.key})` : '' }}
      </div>
    </template>

    <template #tree-node-tool="{ data }">
      <TMagicTooltip v-if="data.type === 'code'" effect="dark" :content="editable ? '编辑' : '查看'" placement="left">
        <TMagicButton
          link
          :icon="editable ? Edit : View"
          class="edit-icon"
          @click.stop="editCode(`${data.key}`)"
        ></TMagicButton>
      </TMagicTooltip>
      <TMagicPopconfirm
        v-if="data.type === 'code' && editable"
        title="确定删除该代码块吗？"
        placement="right"
        :teleported="true"
        @confirm="deleteCode(`${data.key}`, { historySource: 'tree' })"
      >
        <template #reference>
          <span class="delete-icon-wrapper" @click.stop="deleteClickHandler(`${data.key}`)">
            <TMagicTooltip effect="dark" content="删除" placement="right">
              <TMagicButton link :icon="Close" class="edit-icon"></TMagicButton>
            </TMagicTooltip>
          </span>
        </template>
      </TMagicPopconfirm>
      <slot name="code-block-panel-tool" :id="data.key" :data="data"></slot>
    </template>
  </Tree>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Close, Edit, View } from '@element-plus/icons-vue';

import type { Id, MNode } from '@tmagic/core';
import { DepTargetType } from '@tmagic/core';
import { TMagicButton, tMagicMessage, TMagicPopconfirm, TMagicTooltip } from '@tmagic/design';

import Tree from '@editor/components/Tree.vue';
import { useFilter } from '@editor/hooks/use-filter';
import { useNodeStatus } from '@editor/hooks/use-node-status';
import { useServices } from '@editor/hooks/use-services';
import { type CodeBlockListSlots, CodeDeleteErrorType, HistoryOpSource, type TreeNodeData } from '@editor/type';

defineSlots<CodeBlockListSlots>();

defineOptions({
  name: 'MEditorCodeBlockList',
});

const props = defineProps<{
  indent?: number;
  nextLevelIndentIncrement?: number;
  customError?: (_id: Id, _errorType: CodeDeleteErrorType) => any;
}>();

const emit = defineEmits<{
  edit: [id: string];
  remove: [id: string, { historySource?: HistoryOpSource }];
  'node-contextmenu': [event: MouseEvent, data: TreeNodeData];
}>();

const { codeBlockService, depService, editorService } = useServices();

// 代码块列表
const codeList = computed<TreeNodeData[]>(() =>
  Object.entries(codeBlockService.getCodeDsl() || {}).map(([codeId, code]) => {
    const target = depService.getTarget(codeId, DepTargetType.CODE_BLOCK);

    // 按页面分类显示
    const pageList: TreeNodeData[] =
      editorService.get('root')?.items.map((page) => ({
        name: page.devconfig?.tabName || page.name,
        type: 'node',
        id: `${codeId}_${page.id}`,
        key: page.id,
        items: [],
      })) || [];

    // 组件节点
    if (target) {
      Object.entries(target.deps).forEach(([id, dep]) => {
        const page = pageList.find((page) => page.key === dep.data?.pageId);
        page?.items?.push({
          name: dep.name,
          type: 'node',
          id: `${page.id}_${id}`,
          key: id,
          items: dep.keys.map((key) => {
            const data: TreeNodeData = { name: `${key}`, id: `${target.id}_${id}_${key}`, type: 'key' };
            return data;
          }),
        });
      });
    }

    const data: TreeNodeData = {
      id: codeId,
      key: codeId,
      name: code.name,
      type: 'code',
      codeBlockContent: codeBlockService.getCodeContentById(codeId),
      // 只有一个页面不显示页面分类
      items: pageList.length > 1 ? pageList.filter((page) => page.items?.length) : pageList[0]?.items || [],
    };

    return data;
  }),
);

const filterNode = (value: string, data: MNode): boolean => {
  if (!value) {
    return true;
  }
  return `${data.name}${data.id}`.toLocaleLowerCase().includes(value.toLocaleLowerCase());
};

const { nodeStatusMap } = useNodeStatus(codeList);
const { filterTextChangeHandler } = useFilter(codeList, nodeStatusMap, filterNode);

const editable = computed(() => codeBlockService.getEditStatus());

// 选中组件
const selectComp = (compId: Id) => {
  const stage = editorService.get('stage');
  editorService.select(compId);
  stage?.select(compId);
};

const clickHandler = (event: MouseEvent, data: any) => {
  if (data.type === 'node') {
    selectComp(data.key);
  }
};

// 编辑代码块
const editCode = (id: string) => {
  emit('edit', id);
};

/** 返回不能删除的原因，可删除时返回 undefined */
const getDeleteErrorType = (id: string): CodeDeleteErrorType | undefined => {
  const currentCode = codeList.value.find((codeItem) => codeItem.id === id);
  if (currentCode?.items?.length) {
    return CodeDeleteErrorType.BIND;
  }

  return (codeBlockService.getUndeletableList() || []).includes(id) ? CodeDeleteErrorType.UNDELETEABLE : undefined;
};

/** 删除确认由 TMagicPopconfirm 完成，这里只做校验与删除 */
const deleteCode = (id: string, { historySource }: { historySource?: HistoryOpSource } = {}) => {
  const errorType = getDeleteErrorType(id);

  if (errorType) {
    if (typeof props.customError === 'function') {
      props.customError(id, errorType);
    } else if (errorType === CodeDeleteErrorType.BIND) {
      tMagicMessage.error('代码块存在绑定关系，不可删除');
    } else {
      tMagicMessage.error('代码块不可删除');
    }
    return;
  }

  emit('remove', id, { historySource });
};

/** 不可删除的代码块点击后直接说明原因，无需等待确认 */
const deleteClickHandler = (id: string) => {
  if (getDeleteErrorType(id)) {
    deleteCode(id, { historySource: 'tree' });
  }
};

const nodeContentMenuHandler = (event: MouseEvent, data: TreeNodeData) => {
  emit('node-contextmenu', event, data);
};

defineExpose({
  nodeStatusMap,
  filter: filterTextChangeHandler,
  deleteCode,
});
</script>
