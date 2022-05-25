<template>
  <div class="m-editor-workspace" tabindex="1" ref="workspace">
    <magic-stage
      :key="page?.id"
      :runtime-url="runtimeUrl"
      :auto-scroll-into-view="autoScrollIntoView"
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
import { isPage } from '@tmagic/utils';

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
    autoScrollIntoView: Boolean,

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

      const isMac = /mac os x/.test(navigator.userAgent.toLowerCase());

      const ctrl = isMac ? 'meta' : 'ctrl';

      keycon
        .keydown((e) => {
          console.log(e);
          e.inputEvent.preventDefault();
        })
        .keyup('delete', (e) => {
          e.inputEvent.preventDefault();
          if (!node.value || isPage(node.value)) return;
          services?.editorService.remove(node.value);
        })
        .keyup('backspace', (e) => {
          e.inputEvent.preventDefault();
          if (!node.value || isPage(node.value)) return;
          services?.editorService.remove(node.value);
        })
        .keydown([ctrl, 'c'], () => {
          node.value && services?.editorService.copy(node.value);
        })
        .keydown([ctrl, 'v'], () => {
          node.value && services?.editorService.paste();
        })
        .keydown([ctrl, 'x'], () => {
          if (!node.value || isPage(node.value)) return;
          services?.editorService.copy(node.value);
          services?.editorService.remove(node.value);
        })
        .keydown([ctrl, 'z'], () => {
          services?.editorService.undo();
        })
        .keydown([ctrl, 'shift', 'z'], () => {
          services?.editorService.redo();
        })
        .keydown('up', () => {
          services?.editorService.move(0, -1);
        })
        .keydown('down', () => {
          services?.editorService.move(0, 1);
        })
        .keydown('left', () => {
          services?.editorService.move(-1, 0);
        })
        .keydown('right', () => {
          services?.editorService.move(1, 0);
        })
        .keydown([ctrl, 'up'], () => {
          services?.editorService.move(0, -10);
        })
        .keydown([ctrl, 'down'], () => {
          services?.editorService.move(0, 10);
        })
        .keydown([ctrl, 'left'], () => {
          services?.editorService.move(-10, 0);
        })
        .keydown([ctrl, 'right'], () => {
          services?.editorService.move(10, 0);
        })
        .keydown('tab', () => {
          services?.editorService.selectNextNode();
        })
        .keydown([ctrl, 'tab'], () => {
          services?.editorService.selectNextPage();
        })
        .keydown([ctrl, '='], () => {
          services?.uiService.zoom(0.1);
        })
        .keydown([ctrl, 'numpadplus'], () => {
          services?.uiService.zoom(0.1);
        })
        .keydown([ctrl, '-'], () => {
          services?.uiService.zoom(-0.1);
        })
        .keydown([ctrl, 'numpad-'], () => {
          services?.uiService.zoom(-0.1);
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
