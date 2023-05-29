<template>
  <TTree
    ref="tree"
    :data="data"
    :empty="emptyText"
    :keys="nodeKeys"
    :load="loadChildren"
    :activable="highlightCurrent"
    :expandAll="defaultExpandAll"
    :expandParent="autoExpandParent"
    :defaultExpanded="defaultExpandedKeys"
    :actived="currentNodeKey"
    :filter="filterNode"
    :expandMutex="accordion"
    :draggable="draggable"
    :icon="iconRender"
    :lazy="lazy"
    :allowDrag="allowDrag"
    :allowDrop="allowDrop"
    :onClick="nodeClickHandler"
    :onExpand="handleExpand"
    @contextmenu="contextmenu"
  ></TTree>
</template>

<script lang="ts" setup>
import { computed, h, ref } from 'vue';
import { Tree as TTree, TreeNodeModel, TreeNodeValue } from 'tdesign-vue-next';

import type { TreeProps } from '@tmagic/design';

const props = defineProps<TreeProps>();

const nodeKeys = computed(() => ({
  value: props.props?.value || 'value',
  label: props.props?.label || 'label',
  children: props.props?.children || 'children',
}));

const loadChildren = (node: TreeNodeModel<any>) =>
  props.load
    ? new Promise((resolve) => {
        props.load(node, resolve);
      })
    : undefined;

let filterValue: any;

const filterNode = (node: TreeNodeModel<any>) => props.filterNodeMethod?.(filterValue, node.data, node);

const iconRender = () => props.icon && h(props.icon);

const emit = defineEmits([
  'node-click',
  'node-contextmenu',
  'node-drag-end',
  'node-collapse',
  'node-expand',
  'check',
  'mousedown',
  'mouseup',
]);

const nodeClickHandler = (context: { node: TreeNodeModel<any>; e: MouseEvent }) => {
  emit('node-click', context.node.data, context.node, context, context.e);
};

const contextmenu = (...args: any[]) => {
  emit('node-contextmenu', ...args);
};

const handleExpand = (value: Array<TreeNodeValue>, context: { node: TreeNodeModel<any>; e: MouseEvent }) => {
  emit('node-expand', context.node.data, context.node);
};

const tree = ref<InstanceType<typeof TTree>>();

defineExpose({
  getData() {
    return tree.value?.data;
  },

  getStore() {
    return tree.value?.store;
  },

  filter(value: any) {
    filterValue = value;
  },

  getNode(...args: any[]) {
    return tree.value?.getNode(...args);
  },

  setCheckedKeys(...args: any[]) {
    console.log(args);
  },

  setCurrentKey(...args: any[]) {
    console.log(args);
  },
});
</script>
