<template>
  <TMagicScrollbar class="magic-editor-layer-panel">
    <slot name="layer-panel-header"></slot>

    <TMagicInput
      v-model="filterText"
      class="search-input"
      size="small"
      placeholder="输入关键字进行过滤"
      clearable
      :prefix-icon="Search"
      @change="filterTextChangeHandler"
    ></TMagicInput>

    <TMagicTree
      v-if="values.length"
      class="magic-editor-layer-tree"
      ref="tree"
      node-key="id"
      empty-text="页面空荡荡的"
      draggable
      :default-expanded-keys="expandedKeys"
      :default-checked-keys="checkedKeys"
      :current-node-key="currentNodeKey"
      :data="values"
      :expand-on-click-node="false"
      :highlight-current="!isMultiSelect"
      :check-on-click-node="true"
      :props="treeProps"
      :filter-node-method="filterNode"
      :allow-drop="allowDrop"
      :show-checkbox="isMultiSelect"
      @node-click="clickHandler"
      @node-contextmenu="contextmenu"
      @node-drag-end="handleDragEnd"
      @node-collapse="handleCollapse"
      @node-expand="handleExpand"
      @check="checkHandler"
      @mousedown="toggleClickFlag"
      @mouseup="toggleClickFlag"
    >
      <template #default="{ node, data }">
        <div class="cus-tree-node" :id="data.id" @mouseenter="highlightHandler(data)">
          <slot name="layer-node-content" :node="node" :data="data">
            <span>
              {{ `${data.name} (${data.id})` }}
            </span>
          </slot>
        </div>
      </template>
    </TMagicTree>

    <Teleport to="body">
      <LayerMenu ref="menu" :layer-content-menu="layerContentMenu"></LayerMenu>
    </Teleport>
  </TMagicScrollbar>
</template>

<script lang="ts" setup name="MEditorLayerPanel">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import KeyController from 'keycon';
import { difference, throttle, union } from 'lodash-es';

import { TMagicInput, TMagicScrollbar, TMagicTree } from '@tmagic/design';
import type { Id, MNode, MPage } from '@tmagic/schema';
import { MContainer, NodeType } from '@tmagic/schema';
import { getNodePath, isPage } from '@tmagic/utils';

import type { MenuButton, MenuComponent, Services } from '../../type';
import { Layout } from '../../type';

import LayerMenu from './LayerMenu.vue';

defineProps<{
  layerContentMenu: (MenuButton | MenuComponent)[];
}>();

const throttleTime = 150;
const services = inject<Services>('services');
const editorService = services?.editorService;

const tree = ref<InstanceType<typeof TMagicTree>>();
const menu = ref<InstanceType<typeof LayerMenu>>();

// 多选选中的组件id数组
const checkedKeys = ref<Id[]>([]);
// 是否多选
const isCtrlKeyDown = ref(false);
const filterText = ref('');
// 默认展开节点
const expandedKeys = ref<Id[]>([]);
const currentNodeKey = ref<Id>();
// 鼠标是否按下标志，用于高亮状态互斥
const clicked = ref(false);

const treeProps = {
  children: 'items',
  disabled: (data: MNode) => Boolean(data.items?.length),
  class: (data: MNode) => {
    if (clicked.value || isPage(data)) return '';
    if (data.id === highlightNode?.value?.id && !checkedKeys.value.includes(data.id)) {
      return 'cus-tree-node-hover';
    }
  },
};

const isMultiSelect = computed(() => isCtrlKeyDown.value || checkedKeys.value.length > 1);

const nodes = computed(() => editorService?.get('nodes') || []);
const page = computed(() => editorService?.get('page'));
const values = computed(() => (page.value ? [page.value] : []));
// 高亮的节点
const highlightNode = computed(() => editorService?.get('highlightNode'));

// 触发画布单选
const select = async (data: MNode) => {
  if (!data.id) {
    throw new Error('没有id');
  }

  await editorService?.select(data);
  editorService?.get('stage')?.select(data.id);
};

// 触发画布多选
const multiSelect = async (data: Id[]) => {
  await editorService?.multiSelect(data);
  editorService?.get('stage')?.multiSelect(data);
};

// 触发画布高亮
const highlight = (data: MNode) => {
  if (!data?.id) {
    throw new Error('没有id');
  }
  editorService?.highlight(data);
  editorService?.get('stage')?.highlight(data.id);
};

// tree方法：拖拽时判定目标节点能否成为拖动目标位置
const allowDrop = (draggingNode: any, dropNode: any, type: string): boolean => {
  const { data } = dropNode || {};
  const { data: ingData } = draggingNode;

  const { type: ingType } = ingData;

  if (ingType !== NodeType.PAGE && data.type === NodeType.PAGE) return false;
  if (ingType === NodeType.PAGE && data.type !== NodeType.PAGE) return false;
  if (!data || !data.type) return false;
  if (['prev', 'next'].includes(type)) return true;
  if (data.items || data.type === 'container') return true;

  return false;
};

// tree事件：拖拽结束时（可能未成功）触发的事件
const handleDragEnd = async (e: any) => {
  if (!tree.value) return;
  const { data: node } = e;
  const parent = editorService?.getParentById(node.id, false) as MContainer;
  const layout = await editorService?.getLayout(parent);
  node.style.position = layout;
  if (layout === Layout.RELATIVE) {
    node.style.top = 0;
    node.style.left = 0;
  }
  const data = tree.value.getData();
  const [page] = data as [MPage];
  editorService?.update(page);
};

// tree事件：节点被关闭时触发的事件
const handleCollapse = (data: MNode) => {
  expandedKeys.value = expandedKeys.value.filter((id) => id !== data.id);
};

// tree事件：节点被展开时触发的事件
const handleExpand = (data: MNode) => {
  if (!page.value) {
    expandedKeys.value = [];
    return;
  }

  expandedKeys.value = union(
    expandedKeys.value,
    getNodePath(data.id, [page.value]).map((node) => node.id),
  );
};

// tree方法：对树节点进行筛选时执行的方法
const filterNode = (value: string, data: MNode): boolean => {
  if (!value) {
    return true;
  }
  let name = '';
  if (data.name) {
    name = data.name;
  } else if (data.items) {
    name = 'container';
  }
  return `${data.id}${name}${data.type}`.indexOf(value) !== -1;
};

// 过滤关键字
const filterTextChangeHandler = (val: string) => {
  tree.value?.filter(val);
};

watch(nodes, (nodes) => {
  const ids = nodes?.map((node) => node.id) || [];

  const idsLength = ids.length;
  const checkedKeysLength = checkedKeys.value.length;

  if (
    difference(
      idsLength > checkedKeysLength ? ids : checkedKeys.value,
      idsLength > checkedKeysLength ? checkedKeys.value : ids,
    ).length
  ) {
    tree.value?.setCheckedKeys([], false);

    checkedKeys.value = ids.filter((id) => id !== page.value?.id);
    expandedKeys.value = union(expandedKeys.value, ids);
  }

  [currentNodeKey.value] = ids;

  setTimeout(() => {
    tree.value?.setCurrentKey(currentNodeKey.value);
  });
});

watch(isMultiSelect, (isMultiSelect) => {
  if (!isMultiSelect) {
    currentNodeKey.value = editorService?.get('node')?.id;
    tree.value?.setCurrentKey(currentNodeKey.value);
  }
});

const editorServiceRemoveHandler = () => {
  setTimeout(() => {
    tree.value?.getNode(editorService?.get('node')?.id)?.updateChildren();
  }, 0);
};

const windowBlurHandler = () => {
  isCtrlKeyDown.value = false;
};

let keycon: KeyController;

onMounted(() => {
  editorService?.on('remove', editorServiceRemoveHandler);

  keycon = new KeyController();
  const isMac = /mac os x/.test(navigator.userAgent.toLowerCase());
  const ctrl = isMac ? 'meta' : 'ctrl';

  keycon
    .keydown((e) => {
      if (e.key !== ctrl) {
        isCtrlKeyDown.value = false;
      }
    })
    .keydown(ctrl, () => {
      isCtrlKeyDown.value = true;
    })
    .keyup(ctrl, () => {
      isCtrlKeyDown.value = false;
    });

  globalThis.addEventListener('blur', windowBlurHandler);
});

onUnmounted(() => {
  keycon.destroy();

  editorService?.off('remove', editorServiceRemoveHandler);
  globalThis.removeEventListener('blur', windowBlurHandler);
});

// 鼠标在组件树移动触发高亮
const highlightHandler = throttle((data: MNode) => {
  highlight(data);
}, throttleTime);

const toggleClickFlag = () => {
  clicked.value = !clicked.value;
};

// 选择节点多选框
const checkHandler = (data: MNode, { checkedNodes }: any): void => {
  if (!isCtrlKeyDown.value && nodes.value.length < 2) {
    return;
  }
  if (checkedNodes.length > 0) {
    multiSelect(checkedNodes.map((node: MNode) => node.id));
  } else {
    multiSelect(nodes.value.map((node: MNode) => node.id));
  }
};

// 点击节点
const clickHandler = (data: MNode): void => {
  if (isCtrlKeyDown.value) {
    return;
  }
  if (services?.uiService.get('uiSelectMode')) {
    document.dispatchEvent(new CustomEvent('ui-select', { detail: data }));
    return;
  }
  select(data);
};

// 右键菜单
const contextmenu = async (event: MouseEvent, data: MNode): Promise<void> => {
  event.preventDefault();
  await select(data);
  menu.value?.show(event);
};
</script>
