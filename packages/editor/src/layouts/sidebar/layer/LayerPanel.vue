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
import { computed, inject, ref } from 'vue';

import { TMagicScrollbar } from '@tmagic/design';
import type { MNode } from '@tmagic/schema';

import SearchInput from '@editor/components/SearchInput.vue';
import Tree from '@editor/components/Tree.vue';
import { useFilter } from '@editor/hooks/use-filter';
import type { LayerPanelSlots, MenuButton, MenuComponent, Services, TreeNodeData } from '@editor/type';

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
  customContentMenu?: (menus: (MenuButton | MenuComponent)[], type: string) => (MenuButton | MenuComponent)[];
}>();

const services = inject<Services>('services');
const editorService = services?.editorService;

const tree = ref<InstanceType<typeof Tree>>();

const page = computed(() => editorService?.get('page'));
const nodeData = computed<TreeNodeData[]>(() => (!page.value ? [] : [page.value]));

const { nodeStatusMap } = useNodeStatus(services);
const { isCtrlKeyDown } = useKeybinding(services, tree);

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

const {
  menu,
  nodeClickHandler,
  nodeContentMenuHandler,
  highlightHandler: mouseenterHandler,
} = useClick(services, isCtrlKeyDown, nodeStatusMap);
</script>
