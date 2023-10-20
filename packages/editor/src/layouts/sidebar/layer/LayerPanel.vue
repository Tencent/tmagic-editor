<template>
  <TMagicScrollbar class="magic-editor-layer-panel">
    <slot name="layer-panel-header"></slot>

    <SearchInput @search="filterTextChangeHandler"></SearchInput>

    <div class="magic-editor-layer-tree" tabindex="-1" @dragover="handleDragOver">
      <LayerNode
        v-if="page && root"
        :data="page"
        :filter-text="filterText"
        :is-ctrl-key-down="isCtrlKeyDown"
        @node-contextmenu="contextmenu"
      >
        <template #layer-node-content="{ data: nodeData }">
          <slot name="layer-node-content" :data="nodeData"> </slot>
        </template>
      </LayerNode>
    </div>

    <Teleport to="body">
      <LayerMenu ref="menu" :layer-content-menu="layerContentMenu" @collapse-all="collapseAllHandler"></LayerMenu>
    </Teleport>
  </TMagicScrollbar>
</template>

<script setup lang="ts">
import { computed, inject, provide, ref } from 'vue';

import { TMagicScrollbar } from '@tmagic/design';

import SearchInput from '@editor/components/SearchInput.vue';
import type { LayerPanelSlots, MenuButton, MenuComponent, Services } from '@editor/type';

import LayerMenu from './LayerMenu.vue';
import LayerNode from './LayerNode.vue';
import { useDrag } from './use-drag';
import { useFilter } from './use-filter';
import { useKeybinding } from './use-keybinding';
import { useNodeStatus } from './use-node-status';

defineSlots<LayerPanelSlots>();

defineOptions({
  name: 'MEditorLayerPanel',
});

defineProps<{
  layerContentMenu: (MenuButton | MenuComponent)[];
}>();

const services = inject<Services>('services');
const editorService = services?.editorService;

const page = computed(() => editorService?.get('page'));
const root = computed(() => editorService?.get('root'));

const { nodeStatusMap } = useNodeStatus(services, page);
const { isCtrlKeyDown } = useKeybinding(services);

provide('nodeStatusMap', nodeStatusMap);

const { filterText, filterTextChangeHandler } = useFilter(nodeStatusMap, page);

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

// 右键菜单
const menu = ref<InstanceType<typeof LayerMenu>>();
const contextmenu = (event: MouseEvent): void => {
  event.preventDefault();

  menu.value?.show(event);
};

const { handleDragOver } = useDrag(services);
</script>
