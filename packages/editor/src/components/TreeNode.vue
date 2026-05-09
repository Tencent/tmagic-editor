<template>
  <div
    v-show="visible"
    class="m-editor-tree-node"
    :draggable="draggable"
    :data-node-id="data.id"
    :data-parent-id="parent?.id"
    :data-parents-id="parentsId"
    :data-is-container="Array.isArray(data.items)"
    @dragstart="handleDragStart"
    @dragleave="handleDragLeave"
    @dragend="handleDragEnd"
  >
    <div
      class="tree-node"
      :class="{ selected, expanded }"
      :style="`padding-left: ${indent}px`"
      @contextmenu="nodeContextmenuHandler"
      @mouseenter="mouseenterHandler"
    >
      <MIcon
        class="expand-icon"
        :style="isExpandable(data, nodeStatusMap) ? '' : 'color: transparent; cursor: default'"
        :icon="expanded ? ArrowDown : ArrowRight"
        @click="expandHandler"
      ></MIcon>

      <div class="tree-node-content" @click="nodeClickHandler" @dblclick="nodeDblclickHandler">
        <slot name="tree-node-content" :data="data">
          <div class="tree-node-label">
            <slot name="tree-node-label" :data="data">{{ `${data.name} (${data.id})` }}</slot>
          </div>
          <div class="tree-node-tool">
            <slot name="tree-node-tool" :data="data"></slot>
          </div>
        </slot>
      </div>
    </div>

    <div v-if="isExpandable(data, nodeStatusMap) && expanded" class="m-editor-tree-node-children">
      <TreeNode
        v-for="item in data.items"
        :key="item.id"
        :data="item"
        :parent="data"
        :parentsId="[...parentsId, data.id]"
        :node-status-map="nodeStatusMap"
        :indent="indent + nextLevelIndentIncrement"
        :is-expandable="isExpandable"
      >
        <template #tree-node-content="{ data: nodeData }">
          <slot name="tree-node-content" :data="nodeData"> </slot>
        </template>
        <template #tree-node-label="{ data: nodeData }">
          <slot name="tree-node-label" :data="nodeData"> </slot>
        </template>
        <template #tree-node-tool="{ data: nodeData }">
          <slot name="tree-node-tool" :data="nodeData"> </slot>
        </template>
      </TreeNode>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue';

import type { Id } from '@tmagic/core';

import MIcon from '@editor/components/Icon.vue';
import type { IsExpandableFunction, LayerNodeStatus, TreeNodeData } from '@editor/type';
import { defaultIsExpandable, updateStatus } from '@editor/utils/tree';

defineSlots<{
  'tree-node-label'(_props: { data: TreeNodeData }): any;
  'tree-node-tool'(_props: { data: TreeNodeData }): any;
  'tree-node-content'(_props: { data: TreeNodeData }): any;
}>();

defineOptions({
  name: 'MEditorTreeNode',
});

const emit = defineEmits<{
  'node-dragstart': [event: DragEvent, data: TreeNodeData];
  'node-dragleave': [event: DragEvent, data: TreeNodeData];
  'node-dragend': [event: DragEvent, data: TreeNodeData];
  'node-contextmenu': [event: MouseEvent, data: TreeNodeData];
  'node-mouseenter': [event: MouseEvent, data: TreeNodeData];
  'node-click': [event: MouseEvent, data: TreeNodeData];
  'node-dblclick': [event: MouseEvent, data: TreeNodeData];
}>();

const treeEmit = inject<typeof emit>('treeEmit');

const props = withDefaults(
  defineProps<{
    data: TreeNodeData;
    parent?: TreeNodeData;
    parentsId?: Id[];
    nodeStatusMap: Map<Id, LayerNodeStatus>;
    indent?: number;
    nextLevelIndentIncrement?: number;
    /** 自定义判断节点是否可展开（即是否要展示为拥有子节点的形态）的函数 */
    isExpandable?: IsExpandableFunction;
  }>(),
  {
    indent: 0,
    nextLevelIndentIncrement: 11,
    parentsId: () => [],
    isExpandable: defaultIsExpandable,
  },
);

const nodeStatus = computed(
  () =>
    props.nodeStatusMap?.get(props.data.id) || {
      selected: false,
      expand: false,
      visible: false,
      draggable: false,
    },
);

const expanded = computed(() => nodeStatus.value.expand);
const selected = computed(() => nodeStatus.value.selected);
const visible = computed(() => nodeStatus.value.visible);
const draggable = computed(() => nodeStatus.value.draggable);

const handleDragStart = (event: DragEvent) => {
  treeEmit?.('node-dragstart', event, props.data);
};

const handleDragLeave = (event: DragEvent) => {
  treeEmit?.('node-dragleave', event, props.data);
};

const handleDragEnd = (event: DragEvent) => {
  treeEmit?.('node-dragend', event, props.data);
};

const nodeContextmenuHandler = (event: MouseEvent) => {
  treeEmit?.('node-contextmenu', event, props.data);
};

const mouseenterHandler = (event: MouseEvent) => {
  treeEmit?.('node-mouseenter', event, props.data);
};

const expandHandler = () => {
  updateStatus(props.nodeStatusMap, props.data.id, {
    expand: !expanded.value,
  });
};

const nodeClickHandler = (event: MouseEvent) => {
  treeEmit?.('node-click', event, props.data);
};

const nodeDblclickHandler = (event: MouseEvent) => {
  treeEmit?.('node-dblclick', event, props.data);
};
</script>
