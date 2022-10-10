<template>
  <el-scrollbar
    class="magic-editor-layer-panel"
    @mouseenter="addSelectModeListener"
    @mouseleave="removeSelectModeListener"
  >
    <slot name="layer-panel-header"></slot>

    <el-input
      class="filterInput"
      size="small"
      placeholder="输入关键字进行过滤"
      clearable
      v-model="filterText"
      @change="filterTextChangeHandler"
    ></el-input>

    <el-tree
      v-if="values.length"
      ref="tree"
      node-key="id"
      empty-text="页面空荡荡的"
      draggable
      :default-expanded-keys="defaultExpandedKeys"
      :load="loadItems"
      :data="values"
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
    </el-tree>

    <teleport to="body">
      <layer-menu ref="menu"></layer-menu>
    </teleport>
  </el-scrollbar>
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import type { ElTree } from 'element-plus';
import KeyController from 'keycon';
import { throttle } from 'lodash-es';

import type { Id, MNode, MPage } from '@tmagic/schema';
import { MContainer, NodeType } from '@tmagic/schema';
import StageCore from '@tmagic/stage';

import type { Services } from '../../type';
import { Layout } from '../../type';

import LayerMenu from './LayerMenu.vue';

const throttleTime = 150;
const services = inject<Services>('services');
const tree = ref<InstanceType<typeof ElTree>>();
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
  const { data } = tree.value;
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

// 展开树节点
const expandNodes = () => {
  expandedKeys.forEach((key) => {
    if (!tree.value) return;
    tree.value.getNode(key)?.expand();
  });
};

watch(
  () => editorService?.get('nodes'),
  (nodes) => {
    if (!tree.value) return;
    if (!editorService) return;
    if (!nodes) return;
    selectedNodes.value = nodes as unknown as MNode[];

    const parent = editorService.get('parent');
    if (!parent?.id) return;

    const treeNode = tree.value.getNode(parent.id);
    treeNode?.updateChildren();

    setTimeout(() => {
      tree.value &&
        Object.entries(tree.value.store.nodesMap).forEach(([id, node]) => {
          if (node.expanded && node.data.items) {
            expandedKeys.set(id, id);
          }
        });
      expandNodes();
    });
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

watch(selectedIds, () => {
  setTreeKeyStatus();
});

const keycon = ref<KeyController>();
// 监听模式选择
const addSelectModeListener = () => {
  const isMac = /mac os x/.test(navigator.userAgent.toLowerCase());
  const ctrl = isMac ? 'meta' : 'ctrl';
  keycon.value = new KeyController();
  keycon.value.keydown(ctrl, (e) => {
    e.inputEvent.preventDefault();
    isMultiSelectStatus.value = true;
  });
  // ctrl+tab切到其他窗口，需要将多选状态置为false
  keycon.value.on('blur', () => {
    isMultiSelectStatus.value = false;
  });
  keycon.value.keyup(ctrl, (e) => {
    e.inputEvent.preventDefault();
    isMultiSelectStatus.value = false;
  });
};
// 移除监听
const removeSelectModeListener = () => {
  keycon.value?.destroy();
  // 如果鼠标移出监听范围，且当前只选中了一个，置为单选模式(修复按住ctrl不放但鼠标移出的情况)
  if (selectedIds.value.length === 1) isMultiSelectStatus.value = false;
};

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
