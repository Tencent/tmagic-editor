<template>
  <Tree :data="codeList" :node-status-map="nodeStatusMap" @node-click="clickHandler">
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
      <TMagicTooltip v-if="data.type === 'code'" effect="dark" :content="editable ? '编辑' : '查看'" placement="bottom">
        <Icon :icon="editable ? Edit : View" class="edit-icon" @click.stop="editCode(`${data.key}`)"></Icon>
      </TMagicTooltip>
      <TMagicTooltip v-if="data.type === 'code' && editable" effect="dark" content="删除" placement="bottom">
        <Icon :icon="Close" class="edit-icon" @click.stop="deleteCode(`${data.key}`)"></Icon>
      </TMagicTooltip>
      <slot name="code-block-panel-tool" :id="data.key" :data="data"></slot>
    </template>
  </Tree>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { Close, Edit, View } from '@element-plus/icons-vue';

import { DepTargetType } from '@tmagic/dep';
import { tMagicMessage, tMagicMessageBox, TMagicTooltip } from '@tmagic/design';
import type { Id, MNode } from '@tmagic/schema';

import Icon from '@editor/components/Icon.vue';
import Tree from '@editor/components/Tree.vue';
import { useFilter } from '@editor/hooks/use-filter';
import { useNodeStatus } from '@editor/hooks/use-node-status';
import { type CodeBlockListSlots, CodeDeleteErrorType, type Services, type TreeNodeData } from '@editor/type';

defineSlots<CodeBlockListSlots>();

defineOptions({
  name: 'MEditorCodeBlockList',
});

const props = defineProps<{
  customError?: (id: Id, errorType: CodeDeleteErrorType) => any;
}>();

const emit = defineEmits<{
  edit: [id: string];
  remove: [id: string];
}>();

const services = inject<Services>('services');
const { codeBlockService, depService, editorService } = services || {};

// 代码块列表
const codeList = computed<TreeNodeData[]>(() =>
  Object.values(depService?.getTargets(DepTargetType.CODE_BLOCK) || {}).map((target) => {
    // 组件节点
    const compNodes: TreeNodeData[] = Object.entries(target.deps).map(([id, dep]) => ({
      name: dep.name,
      type: 'node',
      id: `${target.id}_${id}`,
      key: id,
      items: dep.keys.map((key) => {
        const data: TreeNodeData = { name: `${key}`, id: `${target.id}_${id}_${key}`, type: 'key' };
        return data;
      }),
    }));

    const data: TreeNodeData = {
      id: target.id,
      key: target.id,
      name: target.name,
      type: 'code',
      codeBlockContent: codeBlockService?.getCodeContentById(target.id),
      items: compNodes,
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

const editable = computed(() => codeBlockService?.getEditStatus());

// 选中组件
const selectComp = (compId: Id) => {
  const stage = editorService?.get('stage');
  editorService?.select(compId);
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

const deleteCode = async (id: string) => {
  const currentCode = codeList.value.find((codeItem) => codeItem.id === id);
  const existBinds = Boolean(currentCode?.items?.length);
  const undeleteableList = codeBlockService?.getUndeletableList() || [];
  if (!existBinds && !undeleteableList.includes(id)) {
    await tMagicMessageBox.confirm('确定删除该代码块吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    // 无绑定关系，且不在不可删除列表中
    emit('remove', id);
  } else {
    if (typeof props.customError === 'function') {
      props.customError(id, existBinds ? CodeDeleteErrorType.BIND : CodeDeleteErrorType.UNDELETEABLE);
    } else {
      tMagicMessage.error('代码块删除失败');
    }
  }
};

defineExpose({
  filter: filterTextChangeHandler,
});
</script>
