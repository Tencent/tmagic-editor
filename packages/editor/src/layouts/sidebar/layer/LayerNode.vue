<template>
  <div
    v-show="visible"
    class="magic-editor-layer-node"
    ref="nodeEl"
    :draggable="!isPage(data)"
    :data-node-id="data.id"
    :data-is-container="Array.isArray(data.items)"
    @dragstart="handleDragStart"
    @dragleave="handleDragLeave"
    @dragend="handleDragEnd($event, data)"
  >
    <div
      class="layer-node"
      :class="{ selected, expanded }"
      :style="`padding-left: ${indent}px`"
      @contextmenu="contextmenuHandler"
      @mouseenter="highlightHandler()"
    >
      <MIcon
        class="expand-icon"
        :style="hasChilren ? '' : 'color: transparent; cursor: default'"
        :icon="expanded ? ArrowDown : ArrowRight"
        @click="expandHandler"
      ></MIcon>

      <div class="layer-node-content" @click="nodeClickHandler">
        <slot name="layer-node-content" :data="data">
          <div class="layer-node-label">{{ `${data.name} (${data.id})` }}</div>
          <div class="layer-node-tool">
            <LayerNodeTool :data="data"></LayerNodeTool>
          </div>
        </slot>
      </div>
    </div>

    <div v-if="hasChilren && expanded" class="magic-editor-layer-node-children">
      <LayerNode
        v-for="item in data.items"
        :data="item"
        :parent="(data as MContainer)"
        :key="item.id"
        :indent="indent + 11"
        :filter-text="filterText"
        :is-ctrl-key-down="isCtrlKeyDown"
        @node-contextmenu="nodeContentmenuHandler"
      >
        <template #layer-node-content="{ data: nodeData }">
          <slot name="layer-node-content" :data="nodeData"> </slot>
        </template>
      </LayerNode>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type ComputedRef, inject, nextTick, ref } from 'vue';
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue';
import { throttle } from 'lodash-es';

import type { Id, MContainer, MNode } from '@tmagic/schema';
import { isPage } from '@tmagic/utils';

import MIcon from '@editor/components/Icon.vue';
import { LayerNodeSlots, LayerNodeStatus, Services, UI_SELECT_MODE_EVENT_NAME } from '@editor/type';

import LayerNodeTool from './LayerNodeTool.vue';
import { useDrag } from './use-drag';
import { updateStatus } from './use-filter';

defineSlots<LayerNodeSlots>();

defineOptions({
  name: 'MEditorLayerNode',
});

const props = withDefaults(
  defineProps<{
    data: MNode;
    parent?: MContainer;
    indent?: number;
    filterText?: string;
    isCtrlKeyDown?: boolean;
  }>(),
  {
    indent: 0,
    filterText: '',
    isCtrlKeyDown: false,
  },
);

const emit = defineEmits<{
  'node-contextmenu': [event: MouseEvent, node: MNode];
}>();

const services = inject<Services>('services');
const nodeStatusMap = inject<ComputedRef<Map<Id, LayerNodeStatus>>>('nodeStatusMap');
const editorService = services?.editorService;
const uiService = services?.uiService;

const nodeStatus = computed(
  () =>
    nodeStatusMap?.value?.get(props.data.id) || {
      selected: false,
      expand: false,
      visible: false,
    },
);

const expanded = computed(() => nodeStatus.value.expand);
const selected = computed(() => nodeStatus.value.selected);
const visible = computed(() => nodeStatus.value.visible);

const hasChilren = computed(() => props.data.items?.length > 0);

const nodeEl = ref<HTMLDivElement>();
const { handleDragStart, handleDragEnd, handleDragLeave } = useDrag(services);

const expandHandler = () => {
  if (!nodeStatusMap?.value) return;

  updateStatus(nodeStatusMap.value, props.data.id, {
    expand: !expanded.value,
  });
};

const nodeClickHandler = () => {
  if (!nodeStatusMap?.value) return;

  if (uiService?.get('uiSelectMode')) {
    document.dispatchEvent(new CustomEvent(UI_SELECT_MODE_EVENT_NAME, { detail: props.data }));
    return;
  }

  if (hasChilren.value && !props.isCtrlKeyDown) {
    updateStatus(nodeStatusMap.value, props.data.id, {
      expand: true,
    });
  }

  nextTick(() => {
    select(props.data);
  });
};

const contextmenuHandler = (event: MouseEvent) => {
  event.preventDefault();

  nodeClickHandler();

  emit('node-contextmenu', event, props.data);
};

const nodeContentmenuHandler = (event: MouseEvent, node: MNode) => {
  emit('node-contextmenu', event, node);
};

// 触发画布选中
const select = async (data: MNode) => {
  if (!data.id) {
    throw new Error('没有id');
  }

  if (props.isCtrlKeyDown) {
    multiSelect(data);
  } else {
    await editorService?.select(data);
    editorService?.get('stage')?.select(data.id);
  }
};

const multiSelect = async (data: MNode) => {
  const nodes = editorService?.get('nodes') || [];

  const newNodes: Id[] = [];
  let isCancel = false;
  nodes.forEach((node) => {
    if (node.id === data.id) {
      isCancel = true;
      return;
    }

    newNodes.push(node.id);
  });

  // 只剩一个不能取消选中
  if (!isCancel || newNodes.length === 0) {
    newNodes.push(data.id);
  }

  await editorService?.multiSelect(newNodes);
  editorService?.get('stage')?.multiSelect(newNodes);
};

const throttleTime = 300;
// 鼠标在组件树移动触发高亮
const highlightHandler = throttle(() => {
  highlight();
}, throttleTime);

// 触发画布高亮
const highlight = () => {
  editorService?.highlight(props.data);
  editorService?.get('stage')?.highlight(props.data.id);
};
</script>
