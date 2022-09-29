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
      :default-expanded-keys="expandedKeys"
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

<script lang="ts">
import { computed, defineComponent, inject, Ref, ref, watchEffect } from 'vue';
import type { ElTree } from 'element-plus';
import KeyController from 'keycon';
import { throttle } from 'lodash-es';

import type { Id, MNode, MPage } from '@tmagic/schema';
import { MContainer, NodeType } from '@tmagic/schema';
import StageCore from '@tmagic/stage';

import type { EditorService } from '../../services/editor';
import type { Services } from '../../type';
import { Layout } from '../../type';

import LayerMenu from './LayerMenu.vue';

const throttleTime = 150;

const select = async (data: MNode, editorService?: EditorService) => {
  if (!data.id) {
    throw new Error('没有id');
  }

  await editorService?.select(data);
  editorService?.get<StageCore>('stage')?.select(data.id);
};

const multiSelect = async (data: Id[], editorService?: EditorService) => {
  await editorService?.multiSelect(data);
  editorService?.get<StageCore>('stage')?.multiSelect(data);
};

const highlight = (data: MNode, editorService?: EditorService) => {
  if (!data?.id) {
    throw new Error('没有id');
  }
  editorService?.highlight(data);
  editorService?.get<StageCore>('stage')?.highlight(data.id);
};

const useDrop = (tree: Ref<InstanceType<typeof ElTree> | undefined>, editorService?: EditorService) => ({
  allowDrop: (draggingNode: any, dropNode: any, type: string): boolean => {
    const { data } = dropNode || {};
    const { data: ingData } = draggingNode;

    const { type: ingType } = ingData;

    if (ingType !== NodeType.PAGE && data.type === NodeType.PAGE) return false;
    if (ingType === NodeType.PAGE && data.type !== NodeType.PAGE) return false;
    if (!data || !data.type) return false;
    if (['prev', 'next'].includes(type)) return true;
    if (data.items || data.type === 'container') return true;

    return false;
  },

  async handleDragEnd(e: any) {
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
  },
});

const useStatus = (tree: Ref<InstanceType<typeof ElTree> | undefined>, editorService?: EditorService) => {
  const page = computed(() => editorService?.get('page'));
  const expandedKeys = new Map<Id, Id>();
  // 多选选中的节点数组
  const selectedNodes = ref<MNode[]>([]);
  // 多选选中的组件id数组
  const selectedIds = computed(() => selectedNodes.value.map((node: MNode) => node.id));
  // 是否多选
  const isMultiSelectStatus = ref(false);
  const keycon = ref<KeyController>();

  const expandNodes = () => {
    expandedKeys.forEach((key) => {
      if (!tree.value) return;
      tree.value.getNode(key)?.expand();
    });
  };

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
    keycon?.value?.destroy();
  };

  // 设置树节点选中状态
  const setTreeKeyStatus = (tree: Ref<InstanceType<typeof ElTree> | undefined>) => {
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

  watchEffect(() => {
    if (!tree.value) return;
    if (!editorService) return;

    selectedNodes.value = editorService.get('nodes');
    // 多选模式如果已存在第一个选中的元素是页面(magic-ui-page) 剔除页面选中状态
    if (
      isMultiSelectStatus.value &&
      selectedNodes.value.length === 1 &&
      selectedNodes.value[0].type === NodeType.PAGE
    ) {
      selectedNodes.value = [];
    }

    setTreeKeyStatus(tree);

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
  });
  return {
    values: computed(() => (page.value ? [page.value] : [])),

    loadItems: (node: any, resolve: Function) => {
      if (Array.isArray(node.data)) {
        return resolve(node.data);
      }
      if (Array.isArray(node.data?.items)) {
        return resolve(node.data?.items);
      }
      resolve([]);
    },

    highlightNode: computed(() => editorService?.get('highlightNode')),
    expandedKeys: computed(() => (selectedIds.value.length > 0 ? selectedIds.value : [])),
    selectedIds,
    selectedNodes,
    isMultiSelectStatus,

    handleCollapse: (data: MNode) => {
      expandedKeys.delete(data.id);
    },

    handleExpand: (data: MNode) => {
      const parent = editorService?.getParentById(data.id);
      if (!parent?.id) return;
      expandedKeys.set(parent.id, parent.id);
    },

    addSelectModeListener,
    removeSelectModeListener,
  };
};

const useFilter = (tree: Ref<InstanceType<typeof ElTree> | undefined>) => ({
  filterText: ref(''),

  filterNode: (value: string, data: MNode): boolean => {
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
  },

  filterTextChangeHandler(val: string) {
    tree.value?.filter(val);
  },
});

export default defineComponent({
  name: 'magic-editor-layer-panel',

  components: { LayerMenu },

  setup() {
    const services = inject<Services>('services');
    const tree = ref<InstanceType<typeof ElTree>>();
    const menu = ref<InstanceType<typeof LayerMenu>>();
    const editorService = services?.editorService;
    const clicked = ref(false);

    const highlightHandler = throttle((data: MNode) => {
      highlight(data, editorService);
    }, throttleTime);

    const toggleClickFlag = () => {
      clicked.value = !clicked.value;
    };

    const statusData = useStatus(tree, editorService);
    const canHighlight = (data: MNode) => {
      if (clicked.value) return false;
      if (statusData.selectedIds.value.length === 1) {
        return !statusData.selectedIds.value.includes(data.id) && data.id === statusData.highlightNode?.value?.id;
      }
      return data.id === statusData.highlightNode?.value?.id;
    };

    editorService?.on('remove', () => {
      setTimeout(() => {
        tree.value?.getNode(editorService.get('node').id)?.updateChildren();
      }, 0);
    });

    // 选择节点多选框
    const multiClickHandler = (data: MNode): void => {
      if (!data?.id) {
        throw new Error('没有id');
      }

      // 页面(magic-ui-page)不可选中
      if (data.type === NodeType.PAGE) return;

      const index = statusData.selectedNodes.value.findIndex((node) => node.id === data.id);
      if (index !== -1) {
        // 已经包含就移除掉
        statusData.selectedNodes.value.splice(index, 1);
      } else {
        statusData.selectedNodes.value = [...statusData.selectedNodes.value, data];
      }
      tree.value?.setCheckedKeys(statusData.selectedIds.value);
      multiSelect(statusData.selectedIds.value, editorService);
    };

    // 点击节点
    const clickHandler = (data: MNode): void => {
      if (!statusData.isMultiSelectStatus.value) {
        if (services?.uiService.get<boolean>('uiSelectMode')) {
          document.dispatchEvent(new CustomEvent('ui-select', { detail: data }));
          return;
        }
        tree.value?.setCurrentKey(data.id);
        select(data, editorService);
      } else {
        multiClickHandler(data);
      }
    };

    // 右键菜单
    const contextmenu = async (event: MouseEvent, data: MNode): Promise<void> => {
      event.preventDefault();
      await select(data, editorService);
      menu.value?.show(event);
    };

    return {
      tree,
      menu,
      ...statusData,
      ...useDrop(tree, editorService),
      ...useFilter(tree),

      highlightHandler,
      canHighlight,
      clickHandler,
      multiClickHandler,
      contextmenu,
      toggleClickFlag,
    };
  },
});
</script>
