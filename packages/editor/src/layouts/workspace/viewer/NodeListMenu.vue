<template>
  <TMagicTooltip v-if="page && buttonVisible" content="点击查看当前位置下的组件">
    <div ref="button" class="m-editor-stage-float-button" @click="visible = true">可选组件</div>
  </TMagicTooltip>
  <FloatingBox
    v-if="page && nodeStatusMap && buttonVisible"
    ref="box"
    v-model:visible="visible"
    title="当前位置下的组件"
    :position="menuPosition"
  >
    <template #body>
      <Tree
        class="m-editor-node-list-menu magic-editor-layer-tree"
        :data="nodeData"
        :node-status-map="nodeStatusMap"
        @node-click="clickHandler"
      ></Tree>
    </template>
  </FloatingBox>
</template>

<script lang="ts" setup>
import { computed, inject, nextTick, ref, watch } from 'vue';

import { TMagicTooltip } from '@tmagic/design';
import type { MNode } from '@tmagic/schema';

import FloatingBox from '@editor/components/FloatingBox.vue';
import Tree from '@editor/components/Tree.vue';
import { useFilter } from '@editor/hooks/use-filter';
import { useNodeStatus } from '@editor/layouts/sidebar/layer/use-node-status';
import type { Services, TreeNodeData } from '@editor/type';

const services = inject<Services>('services');
const editorService = services?.editorService;

const visible = ref(false);
const buttonVisible = ref(false);
const button = ref<HTMLDivElement>();
const box = ref<InstanceType<typeof FloatingBox>>();

const stage = computed(() => editorService?.get('stage'));
const page = computed(() => editorService?.get('page'));
const nodes = computed(() => editorService?.get('nodes') || []);
const nodeData = computed<TreeNodeData[]>(() => (!page.value ? [] : [page.value]));

const { nodeStatusMap } = useNodeStatus(services);

const filterNodeMethod = (value: string, data: MNode): boolean => data.id === value;

const { filterTextChangeHandler } = useFilter(nodeData, nodeStatusMap, filterNodeMethod);

const unWatch = watch(
  stage,
  (stage) => {
    if (!stage) return;

    nextTick(() => unWatch());

    stage.on('select', (el: HTMLElement, event: MouseEvent) => {
      const els = stage.renderer.getElementsFromPoint(event) || [];
      const ids = els.map((el) => el.id).filter((id) => Boolean(id));

      buttonVisible.value = ids.length > 3;

      filterTextChangeHandler(ids);
    });
  },
  {
    immediate: true,
  },
);

watch(
  nodes,
  (nodes) => {
    if (!nodeStatusMap.value) return;

    for (const [id, status] of nodeStatusMap.value.entries()) {
      status.selected = nodes.some((node) => node.id === id);
    }
  },
  {
    immediate: true,
  },
);

const clickHandler = async (event: MouseEvent, data: TreeNodeData) => {
  await editorService?.select(data.id);
  stage.value?.select(data.id);
};

const menuPosition = ref({
  left: 0,
  top: 0,
});

watch(visible, async (visible) => {
  if (!button.value || !visible) {
    return;
  }

  await nextTick();

  const rect = button.value.getBoundingClientRect();
  const height = box.value?.target?.clientHeight || 0;

  menuPosition.value = {
    left: rect.left + rect.width + 5,
    top: rect.top - height / 2 + rect.height / 2,
  };
});
</script>
