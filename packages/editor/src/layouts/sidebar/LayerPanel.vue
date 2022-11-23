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
      tabindex="-1"
      class="magic-editor-layer-tree"
      ref="tree"
      node-key="id"
      empty-text="页面空荡荡的"
      draggable
      :default-expanded-keys="defaultExpandedKeys"
      :load="loadItems"
      :data="values"
      :default-expand-all="true"
      :expand-on-click-node="false"
      :highlight-current="true"
      :props="{
        children: 'items',
      }"
      :filter-node-method="filterNode"
      :allow-drop="allowDrop"
      :show-checkbox="isMultiSelectStatus || selectedIds.length > 1"
      @node-click="clickHandler"
      @node-contextmenu="contextmenu"
      @node-drag-end="handleDragEnd"
      @node-collapse="handleCollapse"
      @node-expand="handleExpand"
      @check="multiClickHandler"
      @mousedown="toggleClickFlag"
      @mouseup="toggleClickFlag"
      @mouseenter="mouseenterHandler"
      @mouseleave="mouseleaveHandler"
    >
      <template #default="{ node, data }">
        <div
          :id="data.id"
          class="cus-tree-node"
          @mouseenter="highlightHandler(data)"
          :class="{ 'cus-tree-node-hover': canHighlight(data) }"
        >
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
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import KeyController from 'keycon';
import { throttle } from 'lodash-es';

import { TMagicInput, TMagicScrollbar, TMagicTree } from '@tmagic/design';
import type { Id, MNode, MPage } from '@tmagic/schema';
import { MContainer, NodeType } from '@tmagic/schema';
import StageCore from '@tmagic/stage';

import type { MenuButton, MenuComponent, Services } from '../../type';
import { Layout } from '../../type';

import LayerMenu from './LayerMenu.vue';

defineProps<{
  layerContentMenu: (MenuButton | MenuComponent)[];
}>();

const throttleTime = 150;
const services = inject<Services>('services');
const tree = ref<InstanceType<typeof TMagicTree>>();
const menu = ref<InstanceType<typeof LayerMenu>>();
const editorService = services?.editorService;
const page = computed(() => editorService?.get('page'));
const values = computed(() => (page.value ? [page.value] : []));
// 多选选中的节点数组
const selectedNodes = ref<MNode[]>([]);
// 多选选中的组件id数组
const selectedIds = computed(() => selectedNodes.value.map((node: MNode) => node.id));
// 是否多选
const isMultiSelectStatus = ref(false);
// 多选场景 取消选中的那个节点id
const spliceNodeKey = ref<Id>();
const filterText = ref('');
// 默认展开节点
const defaultExpandedKeys = computed(() => (selectedIds.value.length > 0 ? selectedIds.value : []));

editorService?.on('remove', () => {
  setTimeout(() => {
    tree.value?.getNode(editorService.get('node').id)?.updateChildren();
  }, 0);
});

// 触发画布单选
const select = async (data: MNode) => {
  if (!data.id) {
    throw new Error('没有id');
  }

  await editorService?.select(data);
  editorService?.get<StageCore>('stage')?.select(data.id);
};

// 触发画布多选
const multiSelect = async (data: Id[]) => {
  await editorService?.multiSelect(data);
  editorService?.get<StageCore>('stage')?.multiSelect(data);
};

// 触发画布高亮
const highlight = (data: MNode) => {
  if (!data?.id) {
    throw new Error('没有id');
  }
  editorService?.highlight(data);
  editorService?.get<StageCore>('stage')?.highlight(data.id);
};

const expandedKeys = new Map<Id, Id>();

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

// tree方法： 加载子树数据的方法
const loadItems = (node: any, resolve: Function) => {
  if (Array.isArray(node.data)) {
    return resolve(node.data);
  }
  if (Array.isArray(node.data?.items)) {
    return resolve(node.data?.items);
  }
  resolve([]);
};

// tree事件：节点被关闭时触发的事件
const handleCollapse = (data: MNode) => {
  expandedKeys.delete(data.id);
};

// tree事件：节点被展开时触发的事件
const handleExpand = (data: MNode) => {
  const parent = editorService?.getParentById(data.id);
  if (!parent?.id) return;
  expandedKeys.set(parent.id, parent.id);
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

// 树节点更新后展开上次展开过的节点
const expandNodes = async () => {
  if (!tree.value) return;
  await nextTick();
  tree.value &&
    Object.entries(tree.value.getStore().nodesMap).forEach(([id, node]: [string, any]) => {
      if (node.expanded && node.data.items) {
        expandedKeys.set(id, id);
      }
    });
  expandedKeys.forEach((key) => {
    if (!tree.value) return;
    tree.value.getNode(key)?.expand();
  });
};

watch(
  () => editorService?.get<MNode[]>('nodes'),
  (nodes) => {
    selectedNodes.value = nodes ?? [];
  },
);

// 设置树节点选中状态
const setTreeKeyStatus = () => {
  if (!tree.value) return;
  if (selectedIds.value.length === 0) {
    tree.value.setCheckedKeys([]);
    tree.value.setCurrentKey();
  } else if (selectedIds.value.length === 1 && !isMultiSelectStatus.value) {
    // 选中1个
    tree.value.setCurrentKey(selectedIds.value[0], true);
    tree.value.setCheckedKeys([]);
  } else {
    // 多选框选中多个
    tree.value.setCheckedKeys(selectedIds.value);
    tree.value.setCurrentKey();
  }
};

watch([selectedIds, tree], async () => {
  if (!tree.value || !editorService) return;
  const parent = editorService.get('parent');
  if (!parent?.id) return;

  const treeNode = tree.value.getNode(parent.id);
  treeNode?.updateChildren();
  await expandNodes();

  // 设置高亮节点操作一定要在刷新展开状态之后，否则可能导致设置的高亮无效
  setTreeKeyStatus();
});

const mouseenterHandler = () => {
  tree.value?.$el.focus();
};

const mouseleaveHandler = () => {
  tree.value?.$el.blur();
  isMultiSelectStatus.value = false;
};

let keycon: KeyController;

onMounted(() => {
  keycon = new KeyController(tree.value?.$el);
  const isMac = /mac os x/.test(navigator.userAgent.toLowerCase());
  const ctrl = isMac ? 'meta' : 'ctrl';

  keycon
    .keydown(ctrl, (e) => {
      e.inputEvent.preventDefault();
      isMultiSelectStatus.value = true;
    })
    .keyup(ctrl, (e) => {
      e.inputEvent.preventDefault();
      isMultiSelectStatus.value = false;
    });
});

onUnmounted(() => {
  keycon.destroy();
});

// 鼠标是否按下标志，用于高亮状态互斥
const clicked = ref(false);
// 高亮的节点
const highlightNode = computed(() => editorService?.get('highlightNode'));

// 鼠标在组件树移动触发高亮
const highlightHandler = throttle((data: MNode) => {
  highlight(data);
}, throttleTime);

const toggleClickFlag = () => {
  clicked.value = !clicked.value;
};

// 是否满足展示高亮
const canHighlight = (data: MNode) => {
  if (clicked.value) return false;
  return (
    data.id === highlightNode?.value?.id && !selectedIds.value.includes(data.id) && spliceNodeKey.value !== data.id
  );
};

// 监听选择模式，针对多选情况做一些处理
watch(isMultiSelectStatus, () => {
  // 多选模式如果已存在第一个选中的元素是页面(magic-ui-page) 剔除页面选中状态
  if (isMultiSelectStatus.value && selectedNodes.value.length === 1 && selectedNodes.value[0].type === NodeType.PAGE) {
    selectedNodes.value = [];
  }
});

// 选择节点多选框
const multiClickHandler = (data: MNode): void => {
  if (!data?.id) {
    throw new Error('没有id');
  }

  // 页面(magic-ui-page)不可选中
  if (data.type === NodeType.PAGE) {
    tree.value?.setCheckedKeys([]);
    return;
  }

  const index = selectedNodes.value.findIndex((node) => node.id === data.id);
  if (index !== -1) {
    // 已经包含就移除掉
    selectedNodes.value.splice(index, 1);
    spliceNodeKey.value = data.id;
  } else {
    selectedNodes.value = [...selectedNodes.value, data];
  }
  tree.value?.setCheckedKeys(selectedIds.value);
  multiSelect(selectedIds.value);
};

// 点击节点
const clickHandler = (data: MNode): void => {
  if (!isMultiSelectStatus.value) {
    if (services?.uiService.get<boolean>('uiSelectMode')) {
      document.dispatchEvent(new CustomEvent('ui-select', { detail: data }));
      return;
    }
    tree.value?.setCurrentKey(data.id);
    select(data);
  } else {
    multiClickHandler(data);
  }
};

// 右键菜单
const contextmenu = async (event: MouseEvent, data: MNode): Promise<void> => {
  event.preventDefault();
  await select(data);
  menu.value?.show(event);
};
</script>
