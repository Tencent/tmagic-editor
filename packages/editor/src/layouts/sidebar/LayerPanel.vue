<template>
  <el-scrollbar class="magic-editor-layer-panel">
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
      @node-click="clickHandler"
      @node-contextmenu="contextmenu"
      @node-drag-end="handleDragEnd"
      empty-text="页面空荡荡的"
    >
      <template #default="{ node, data }">
        <div
          :id="data.id"
          class="cus-tree-node"
          @mousedown="toggleClickFlag"
          @mouseup="toggleClickFlag"
          @mouseenter="highlightHandler(data)"
          :class="{ 'cus-tree-node-hover': canHighlight && data.id === highlightNode?.id }"
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
import { throttle } from 'lodash-es';

import type { MNode, MPage } from '@tmagic/schema';
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
  const highlightNode = ref<MNode>();
  const node = ref<MNode>();
  const page = computed(() => editorService?.get('page'));

  watchEffect(() => {
    if (!tree.value) return;
    node.value = editorService?.get('node');
    node.value && tree.value.setCurrentKey(node.value.id, true);

    const parent = editorService?.get('parent');
    if (!parent?.id) return;

    const treeNode = tree.value.getNode(parent.id);
    treeNode?.updateChildren();

    highlightNode.value = editorService?.get('highlightNode');
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

    highlightNode,
    clickNode: node,
    expandedKeys: computed(() => (node.value ? [node.value.id] : [])),
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
    const clicked = ref(false);
    const editorService = services?.editorService;
    const highlightHandler = throttle((data: MNode) => {
      highlight(data, editorService);
    }, throttleTime);

    const toggleClickFlag = () => {
      clicked.value = !clicked.value;
    };

    const statusData = useStatus(tree, editorService);
    const canHighlight = computed(
      () => statusData.highlightNode.value?.id !== statusData.clickNode.value?.id && !clicked.value,
    );

    editorService?.on('remove', () => {
      setTimeout(() => {
        tree.value?.getNode(editorService.get('node').id)?.updateChildren();
      }, 0);
    });

    return {
      tree,
      menu,
      ...statusData,
      ...useDrop(tree, editorService),
      ...useFilter(tree),

      highlightHandler,
      toggleClickFlag,
      canHighlight,

      clickHandler(data: MNode): void {
        if (services?.uiService.get<boolean>('uiSelectMode')) {
          document.dispatchEvent(new CustomEvent('ui-select', { detail: data }));
          return;
        }
        tree.value?.setCurrentKey(data.id);
        select(data, editorService);
      },

      async contextmenu(event: MouseEvent, data: MNode) {
        event.preventDefault();
        await select(data, editorService);
        menu.value?.show(event);
      },
    };
  },
});
</script>
