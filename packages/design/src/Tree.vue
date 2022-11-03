<template>
  <component
    ref="tree"
    :is="uiComponent.component"
    v-bind="uiProps"
    @node-click="nodeClickHandler"
    @node-contextmenu="contextmenu"
    @node-drag-end="handleDragEnd"
    @node-collapse="handleCollapse"
    @node-expand="handleExpand"
    @check="checkHandler"
    @mousedown="mousedownHandler"
    @mouseup="mouseupHandler"
  >
    <template #default="{ data, node }">
      <slot :data="data" :node="node"></slot>
    </template>
  </component>
</template>

<script setup lang="ts" name="TMTree">
import { computed, ref } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  data?: any[];
  emptyText?: string;
  nodeKey?: string;
  props?: any;
  renderAfterExpand?: boolean;
  load?: any;
  renderContent?: any;
  highlightCurrent?: boolean;
  defaultExpandAll?: boolean;
  checkOnClickNode?: boolean;
  autoExpandParent?: boolean;
  defaultExpandedKeys?: any[];
  showCheckbox?: boolean;
  checkStrictly?: boolean;
  defaultCheckedKeys?: any[];
  currentNodeKey?: string | number;
  filterNodeMethod?: (value: any, data: any, node: any) => void;
  accordion?: boolean;
  indent?: number;
  icon?: any;
  lazy?: boolean;
  draggable?: boolean;
  allowDrag?: (node: any) => boolean;
  allowDrop?: any;
}>();

const uiComponent = getConfig('components').tree;

const uiProps = computed(() => uiComponent.props(props));

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

const nodeClickHandler = (...args: any[]) => {
  emit('node-click', ...args);
};

const contextmenu = (...args: any[]) => {
  emit('node-contextmenu', ...args);
};

const handleDragEnd = (...args: any[]) => {
  emit('node-drag-end', ...args);
};

const handleCollapse = (...args: any[]) => {
  emit('node-collapse', ...args);
};

const handleExpand = (...args: any[]) => {
  emit('node-expand', ...args);
};

const checkHandler = (...args: any[]) => {
  emit('check', ...args);
};

const mousedownHandler = (...args: any[]) => {
  emit('mousedown', ...args);
};

const mouseupHandler = (...args: any[]) => {
  emit('mouseup', ...args);
};

const tree = ref<any>();

defineExpose({
  getData() {
    return tree.value?.data;
  },

  getStore() {
    return tree.value?.store;
  },

  filter(...args: any[]) {
    return tree.value?.filter(...args);
  },

  getNode(...args: any[]) {
    return tree.value?.getNode(...args);
  },

  setCheckedKeys(...args: any[]) {
    return tree.value?.setCheckedKeys(...args);
  },

  setCurrentKey(...args: any[]) {
    return tree.value?.setCurrentKey(...args);
  },
});
</script>
