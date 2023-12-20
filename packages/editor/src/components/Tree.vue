<template>
  <div class="m-editor-tree" @dragover="handleDragOver">
    <template v-if="data?.length">
      <TreeNode v-for="item in data" :key="item.id" :data="item" :indent="indent" :node-status-map="nodeStatusMap">
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
    </template>
    <div v-else class="m-editor-tree-empty">
      <p>{{ emptyText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue';

import type { Id } from '@tmagic/schema';

import type { LayerNodeStatus, TreeNodeData } from '@editor/type';

import TreeNode from './TreeNode.vue';

defineSlots<{
  'tree-node-content'(props: { data: TreeNodeData }): any;
  'tree-node-label'(props: { data: TreeNodeData }): any;
  'tree-node-tool'(props: { data: TreeNodeData }): any;
}>();

defineOptions({
  name: 'MEditorTree',
});

const emit = defineEmits<{
  'node-dragover': [event: DragEvent];
  'node-dragstart': [event: DragEvent, data: TreeNodeData];
  'node-dragleave': [event: DragEvent, data: TreeNodeData];
  'node-dragend': [event: DragEvent, data: TreeNodeData];
  'node-contextmenu': [event: MouseEvent, data: TreeNodeData];
  'node-mouseenter': [event: MouseEvent, data: TreeNodeData];
  'node-click': [event: MouseEvent, data: TreeNodeData];
}>();

provide('treeEmit', emit);

withDefaults(
  defineProps<{
    data: TreeNodeData[];
    nodeStatusMap: Map<Id, LayerNodeStatus>;
    indent?: number;
    emptyText?: string;
  }>(),
  {
    indent: 0,
    emptyText: '暂无数据',
  },
);

const handleDragOver = (event: DragEvent) => {
  emit('node-dragover', event);
};
</script>
