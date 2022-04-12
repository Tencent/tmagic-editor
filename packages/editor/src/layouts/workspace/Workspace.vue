<template>
  <div class="m-editor-workspace" tabindex="1" ref="workspace">
    <magic-stage
      :key="page?.id"
      :runtime-url="runtimeUrl"
      :render="render"
      :moveable-options="moveableOptions"
      :can-select="canSelect"
    ></magic-stage>

    <slot name="workspace-content"></slot>

    <page-bar>
      <template #page-bar-title="{ page }"><slot name="page-bar-title" :page="page"></slot></template>
      <template #page-bar-popover="{ page }"><slot name="page-bar-popover" :page="page"></slot></template>
    </page-bar>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onMounted, onUnmounted, PropType, ref } from 'vue';
import KeyController from 'keycon';

import type { MNode, MPage } from '@tmagic/schema';
import type { MoveableOptions } from '@tmagic/stage';
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
    const workspace = ref<HTMLDivElement>();
    const node = computed(() => services?.editorService.get<MNode>('node'));
    let keycon: KeyController;

    const mouseenterHandler = () => {
      workspace.value?.focus();
    };

    const mouseleaveHandler = () => {
      workspace.value?.blur();
    };

    onMounted(() => {
      workspace.value?.addEventListener('mouseenter', mouseenterHandler);

      workspace.value?.addEventListener('mouseleave', mouseleaveHandler);

      keycon = new KeyController(workspace.value);

      keycon
        .keyup('delete', () => {
          node.value && services?.editorService.remove(node.value);
        })
        .keyup(['ctrl', 'c'], () => {
          node.value && services?.editorService.copy(node.value);
        })
        .keyup(['ctrl', 'v'], () => {
          node.value && services?.editorService.paste();
        })
        .keyup(['ctrl', 'x'], () => {
          if (node.value && services) {
            services.editorService.copy(node.value);
            services.editorService.remove(node.value);
          }
        });
    });

    onUnmounted(() => {
      workspace.value?.removeEventListener('mouseenter', mouseenterHandler);
      workspace.value?.removeEventListener('mouseleave', mouseleaveHandler);
      keycon.destroy();
    });

    return {
      workspace,

      page: computed(() => services?.editorService.get<MPage>('page')),
    };
  },
});
</script>
