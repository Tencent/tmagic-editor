<template>
  <TMagicScrollbar class="m-editor-layer-panel">
    <slot name="layer-panel-header"></slot>

    <SearchInput @search="filterTextChangeHandler"></SearchInput>

    <Tree
      v-if="page && nodeStatusMap"
      tabindex="-1"
      ref="tree"
      :data="nodeData"
      :node-status-map="nodeStatusMap"
      :indent="indent"
      :next-level-indent-increment="nextLevelIndentIncrement"
      @node-dragover="handleDragOver"
      @node-dragstart="handleDragStart"
      @node-dragleave="handleDragLeave"
      @node-dragend="handleDragEnd"
      @node-contextmenu="nodeContentMenuHandler"
      @node-mouseenter="mouseenterHandler"
      @node-click="nodeClickHandler"
    >
      <template #tree-node-content="{ data: nodeData }">
        <slot name="layer-node-content" :data="nodeData"> </slot>
      </template>

      <template #tree-node-tool="{ data: nodeData }">
        <slot name="layer-node-tool" :data="nodeData">
          <LayerNodeTool :data="nodeData"></LayerNodeTool>
        </slot>
      </template>

      <template #tree-node-label="{ data: nodeData }">
        <slot name="layer-node-label" :data="nodeData"></slot>
      </template>
    </Tree>

    <Teleport to="body">
      <LayerMenu
        ref="menu"
        :layer-content-menu="layerContentMenu"
        :custom-content-menu="customContentMenu"
        @collapse-all="collapseAllHandler"
      ></LayerMenu>
    </Teleport>
  </TMagicScrollbar>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import type { MNode } from '@tmagic/core';
import { TMagicScrollbar } from '@tmagic/design';

import SearchInput from '@editor/components/SearchInput.vue';
import Tree from '@editor/components/Tree.vue';
import { useFilter } from '@editor/hooks/use-filter';
import { useServices } from '@editor/hooks/use-services';
import type { CustomContentMenuFunction, LayerPanelSlots, MenuButton, MenuComponent, TreeNodeData } from '@editor/type';

import LayerMenu from './LayerMenu.vue';
import LayerNodeTool from './LayerNodeTool.vue';
import { useClick } from './use-click';
import { useDrag } from './use-drag';
import { useKeybinding } from './use-keybinding';
import { useNodeStatus } from './use-node-status';

defineSlots<LayerPanelSlots>();

defineOptions({
  name: 'MEditorLayerPanel',
});

defineProps<{
  layerContentMenu: (MenuButton | MenuComponent)[];
  indent?: number;
  nextLevelIndentIncrement?: number;
  customContentMenu: CustomContentMenuFunction;
}>();

const services = useServices();
const { editorService } = services;

const treeRef = useTemplateRef<InstanceType<typeof Tree>>('tree');

const page = computed(() => editorService.get('page'));
const nodeData = computed<TreeNodeData[]>(() => (!page.value ? [] : [page.value]));

const { nodeStatusMap } = useNodeStatus(services);
const { isCtrlKeyDown } = useKeybinding(services, treeRef);

const filterNodeMethod = (v: string, data: MNode): boolean => {
  let name = '';
  if (data.name) {
    name = data.name;
  } else if (data.items) {
    name = 'container';
  }

  return `${data.id}${name}${data.type}`.includes(v);
};

const { filterTextChangeHandler } = useFilter(nodeData, nodeStatusMap, filterNodeMethod);

const collapseAllHandler = () => {
  if (!page.value || !nodeStatusMap.value) return;
  const items = nodeStatusMap.value.entries();
  for (const [id, status] of items) {
    if (id === page.value.id) {
      continue;
    }
    status.expand = false;
  }
};

const { handleDragStart, handleDragEnd, handleDragLeave, handleDragOver } = useDrag(services);

// 右键菜单
const menuRef = useTemplateRef<InstanceType<typeof LayerMenu>>('menu');
const {
  nodeClickHandler,
  nodeContentMenuHandler,
  highlightHandler: mouseenterHandler,
} = useClick(services, isCtrlKeyDown, nodeStatusMap, menuRef);
</script>
