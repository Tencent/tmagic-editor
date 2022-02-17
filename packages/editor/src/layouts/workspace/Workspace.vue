<template>
  <div class="m-editor-workspace">
    <magic-stage
      :key="page?.id"
      :runtime-url="runtimeUrl"
      :render="render"
      :ui-select-mode="uiSelectMode"
      :root="root"
      :page="page"
      :node="node"
      :zoom="zoom"
      :moveable-options="moveableOptions"
      :can-select="canSelect"
      @select="selectHandler"
      @update="updateNodeHandler"
      @sort="sortNodeHandler"
    ></magic-stage>

    <slot name="workspace-content"></slot>

    <page-bar>
      <template #page-bar-title="{ page }"><slot name="page-bar-title" :page="page"></slot></template>
      <template #page-bar-popover="{ page }"><slot name="page-bar-popover" :page="page"></slot></template>
    </page-bar>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, nextTick, PropType, watch } from 'vue';

import type { MApp, MComponent, MContainer, MNode, MPage } from '@tmagic/schema';
import type { MoveableOptions, SortEventData } from '@tmagic/stage';
import StageCore from '@tmagic/stage';

import type { Services } from '@editor/type';

import PageBar from './PageBar.vue';
import MagicStage from './Stage.vue';

export default defineComponent({
  name: 'm-editor-workspace',

  components: {
    PageBar,
    MagicStage,
  },

  props: {
    runtimeUrl: String,

    render: {
      type: Function as PropType<() => HTMLDivElement>,
    },

    moveableOptions: {
      type: [Object, Function] as PropType<MoveableOptions | ((core?: StageCore) => MoveableOptions)>,
    },

    canSelect: {
      type: Function as PropType<(el: HTMLElement) => boolean | Promise<boolean>>,
    },
  },

  setup() {
    const services = inject<Services>('services');
    const node = computed(() => services?.editorService.get<MNode>('node'));
    const stage = computed(() => services?.editorService.get<StageCore>('stage'));

    watch([() => node.value?.id, stage], ([id, stage]) => {
      nextTick(() => {
        // 等待相关dom变更完成后，再select，适用大多数场景
        id && stage?.select(id);
      });
    });

    return {
      uiSelectMode: computed(() => services?.uiService.get<boolean>('uiSelectMode')),
      root: computed(() => services?.editorService.get<MApp>('root')),
      page: computed(() => services?.editorService.get<MPage>('page')),
      zoom: computed(() => services?.uiService.get<number>('zoom')),

      node,

      selectHandler(el: HTMLElement) {
        services?.editorService.select(el.id);
      },

      updateNodeHandler(node: MComponent | MContainer | MPage) {
        services?.editorService.update(node);
      },

      sortNodeHandler(ev: SortEventData) {
        services?.editorService.sort(ev.src, ev.dist);
      },
    };
  },
});
</script>
