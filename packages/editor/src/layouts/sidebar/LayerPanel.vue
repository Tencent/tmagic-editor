<template>
  <el-scrollbar class="magic-editor-layer-panel">
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
        <slot name="layer-node-content" :node="node" :data="data">
          <span>
            {{ `${data.name} (${data.id})` }}
          </span>
        </slot>
      </template>
    </el-tree>

    <teleport to="body">
      <layer-menu :style="menuStyle"></layer-menu>
    </teleport>
  </el-scrollbar>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onMounted, Ref, ref, watchEffect } from 'vue';
import type { ElTree } from 'element-plus';

import type { MNode, MPage } from '@tmagic/schema';

import type { EditorService } from '@editor/services/editor';
import type { Services } from '@editor/type';

import LayerMenu from './LayerMenu.vue';

const select = (data: MNode, editorService?: EditorService) => {
  if (!data.id) {
    throw new Error('没有id');
  }

  editorService?.select(data);
};

const useDrop = (tree: Ref<InstanceType<typeof ElTree> | undefined>, editorService?: EditorService) => ({
  allowDrop: (draggingNode: any, dropNode: any, type: string): boolean => {
    const { data } = dropNode || {};
    const { data: ingData } = draggingNode;

    const { type: ingType } = ingData;

    if (ingType !== 'page' && data.type === 'page') return false;
    if (ingType === 'page' && data.type !== 'page') return false;
    if (!data || !data.type) return false;
    if (['prev', 'next'].includes(type)) return true;
    if (data.items || data.type === 'container') return true;

    return false;
  },

  handleDragEnd() {
    if (!tree.value) return;
    const { data } = tree.value;
    const [page] = data as [MPage];
    editorService?.update(page);
  },
});

const useStatus = (tree: Ref<InstanceType<typeof ElTree> | undefined>, editorService?: EditorService) => {
  const page = computed(() => editorService?.get('page'));

  watchEffect(() => {
    if (!tree.value) return;

    const node = editorService?.get('node');
    node && tree.value.setCurrentKey(node.id, true);

    const parent = editorService?.get('parent');
    if (!parent?.id) return;

    const treeNode = tree.value.getNode(parent.id);
    treeNode?.updateChildren();
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
    } else if (data.type) {
      name = data.type;
    } else if (data.items) {
      name = 'container';
    }
    return name.indexOf(value) !== -1;
  },

  filterTextChangeHandler(val: string) {
    tree.value?.filter(val);
  },
});

const useContentMenu = (editorService?: EditorService) => {
  const menuStyle = ref({
    position: 'absolute',
    left: '0',
    top: '0',
    display: 'none',
  });

  onMounted(() => {
    document.addEventListener(
      'click',
      () => {
        menuStyle.value.display = 'none';
      },
      true,
    );
  });

  return {
    menuStyle,

    contextmenu(event: MouseEvent, data: MNode) {
      const bodyHeight = globalThis.document.body.clientHeight;

      const left = `${event.clientX + 20}px`;
      let top = `${event.clientY - 10}px`;

      if (event.clientY + 300 > bodyHeight) {
        top = `${bodyHeight - 300}px`;
      }

      menuStyle.value.left = left;
      menuStyle.value.top = top;
      menuStyle.value.display = '';

      select(data, editorService);
    },
  };
};

export default defineComponent({
  name: 'magic-editor-layer-panel',

  components: { LayerMenu },

  setup() {
    const services = inject<Services>('services');
    const tree = ref<InstanceType<typeof ElTree>>();
    const editorService = services?.editorService;
    return {
      tree,
      ...useDrop(tree, editorService),
      ...useStatus(tree, editorService),
      ...useFilter(tree),
      ...useContentMenu(editorService),

      clickHandler(data: MNode): void {
        if (services?.uiService.get<boolean>('uiSelectMode')) {
          document.dispatchEvent(new CustomEvent('ui-select', { detail: data }));
          return;
        }
        select(data, editorService);
      },
    };
  },
});
</script>
