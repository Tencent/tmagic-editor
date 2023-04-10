<template>
  <div class="m-editor-workspace" tabindex="-1" ref="workspace">
    <Breadcrumb></Breadcrumb>

    <slot name="stage">
      <MagicStage v-if="page" :stage-content-menu="stageContentMenu"></MagicStage>
    </slot>

    <slot name="workspace-content"></slot>

    <PageBar>
      <template #page-bar-title="{ page }"><slot name="page-bar-title" :page="page"></slot></template>
      <template #page-bar-popover="{ page }"><slot name="page-bar-popover" :page="page"></slot></template>
    </PageBar>
  </div>
</template>

<script lang="ts" setup name="MEditorWorkspace">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
import KeyController from 'keycon';

import { isPage } from '@tmagic/utils';

import type { MenuButton, MenuComponent, Services } from '@editor/type';

import Breadcrumb from './Breadcrumb.vue';
import PageBar from './PageBar.vue';
import MagicStage from './Stage.vue';

defineProps<{
  stageContentMenu: (MenuButton | MenuComponent)[];
}>();

const services = inject<Services>('services');
const workspace = ref<HTMLDivElement>();
const nodes = computed(() => services?.editorService.get('nodes'));
const page = computed(() => services?.editorService.get('page'));

const mouseenterHandler = () => {
  workspace.value?.focus();
};

const mouseleaveHandler = () => {
  workspace.value?.blur();
};

let keycon: KeyController;

onMounted(() => {
  workspace.value?.addEventListener('mouseenter', mouseenterHandler);
  workspace.value?.addEventListener('mouseleave', mouseleaveHandler);

  keycon = new KeyController(workspace.value);

  const isMac = /mac os x/.test(navigator.userAgent.toLowerCase());

  const ctrl = isMac ? 'meta' : 'ctrl';

  keycon
    .keyup('delete', (e) => {
      e.inputEvent.preventDefault();
      if (!nodes.value || isPage(nodes.value[0])) return;
      services?.editorService.remove(nodes.value);
    })
    .keyup('backspace', (e) => {
      e.inputEvent.preventDefault();
      if (!nodes.value || isPage(nodes.value[0])) return;
      services?.editorService.remove(nodes.value);
    })
    .keydown([ctrl, 'c'], (e) => {
      e.inputEvent.preventDefault();
      nodes.value && services?.editorService.copy(nodes.value);
    })
    .keydown([ctrl, 'v'], (e) => {
      e.inputEvent.preventDefault();
      nodes.value && services?.editorService.paste({ offsetX: 10, offsetY: 10 });
    })
    .keydown([ctrl, 'x'], (e) => {
      e.inputEvent.preventDefault();
      if (!nodes.value || isPage(nodes.value[0])) return;
      services?.editorService.copy(nodes.value);
      services?.editorService.remove(nodes.value);
    })
    .keydown([ctrl, 'z'], (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.undo();
    })
    .keydown([ctrl, 'shift', 'z'], (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.redo();
    })
    .keydown('up', (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.move(0, -1);
    })
    .keydown('down', (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.move(0, 1);
    })
    .keydown('left', (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.move(-1, 0);
    })
    .keydown('right', (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.move(1, 0);
    })
    .keydown([ctrl, 'up'], (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.move(0, -10);
    })
    .keydown([ctrl, 'down'], (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.move(0, 10);
    })
    .keydown([ctrl, 'left'], (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.move(-10, 0);
    })
    .keydown([ctrl, 'right'], (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.move(10, 0);
    })
    .keydown('tab', (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.selectNextNode();
    })
    .keydown([ctrl, 'tab'], (e) => {
      e.inputEvent.preventDefault();
      services?.editorService.selectNextPage();
    })
    .keydown([ctrl, '='], (e) => {
      e.inputEvent.preventDefault();
      services?.uiService.zoom(0.1);
    })
    .keydown([ctrl, 'numpadplus'], (e) => {
      e.inputEvent.preventDefault();
      services?.uiService.zoom(0.1);
    })
    .keydown([ctrl, '-'], (e) => {
      e.inputEvent.preventDefault();
      services?.uiService.zoom(-0.1);
    })
    .keydown([ctrl, 'numpad-'], (e) => {
      e.inputEvent.preventDefault();
      services?.uiService.zoom(-0.1);
    })
    .keydown([ctrl, '0'], async (e) => {
      e.inputEvent.preventDefault();
      services?.uiService.set('zoom', await services.uiService.calcZoom());
    })
    .keydown([ctrl, '1'], (e) => {
      e.inputEvent.preventDefault();
      services?.uiService.set('zoom', 1);
    });
});

onUnmounted(() => {
  workspace.value?.removeEventListener('mouseenter', mouseenterHandler);
  workspace.value?.removeEventListener('mouseleave', mouseleaveHandler);
  keycon.destroy();
});
</script>
