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
      @contextmenu="nodeContentmenuHandler"
      @mouseenter="mouseenterHandler"
    >
      <MIcon
        class="expand-icon"
        :style="hasChildren ? '' : 'color: transparent; cursor: default'"
        :icon="expanded ? ArrowDown : ArrowRight"
        @click="expandHandler"
      ></MIcon>

      <div class="tree-node-content" @click="nodeClickHandler">
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

    <div v-if="hasChildren && expanded" class="m-editor-tree-node-children">
      <TreeNode
        v-for="item in data.items"
        :key="item.id"
        :data="item"
        :parent="data"
        :parentsId="[...parentsId, data.id]"
        :node-status-map="nodeStatusMap"
        :indent="indent + 11"
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

import type { Id } from '@tmagic/schema';

import MIcon from '@editor/components/Icon.vue';
import type { LayerNodeStatus, TreeNodeData } from '@editor/type';
import { updateStatus } from '@editor/utils/tree';

defineSlots<{
  'tree-node-label'(props: { data: TreeNodeData }): any;
  'tree-node-tool'(props: { data: TreeNodeData }): any;
  'tree-node-content'(props: { data: TreeNodeData }): any;
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
}>();

const treeEmit = inject<typeof emit>('treeEmit');

const props = withDefaults(
  defineProps<{
    data: TreeNodeData;
    parent?: TreeNodeData;
    parentsId?: Id[];
    nodeStatusMap: Map<Id, LayerNodeStatus>;
    indent?: number;
  }>(),
  {
    indent: 0,
    parentsId: () => [],
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

const hasChildren = computed(
  () => Array.isArray(props.data.items) && props.data.items.some((item) => props.nodeStatusMap.get(item.id)?.visible),
);

const handleDragStart = (event: DragEvent) => {
  treeEmit?.('node-dragstart', event, props.data);
};

const handleDragLeave = (event: DragEvent) => {
  treeEmit?.('node-dragleave', event, props.data);
};

const handleDragEnd = (event: DragEvent) => {
  treeEmit?.('node-dragend', event, props.data);
};

const nodeContentmenuHandler = (event: MouseEvent) => {
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
</script>
