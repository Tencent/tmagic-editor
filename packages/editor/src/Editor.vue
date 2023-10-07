<template>
  <Framework>
    <template #header>
      <slot name="header"></slot>
    </template>

    <template #nav>
      <slot name="nav" :editorService="editorService"><TMagicNavMenu :data="menu"></TMagicNavMenu></slot>
    </template>

    <template #content-before>
      <slot name="content-before"></slot>
    </template>

    <template #src-code><slot name="src-code" :editorService="editorService"></slot></template>

    <template #sidebar>
      <slot name="sidebar" :editorService="editorService">
        <Sidebar :data="sidebar" :layer-content-menu="layerContentMenu">
          <template #layer-panel-header>
            <slot name="layer-panel-header"></slot>
          </template>

          <template #layer-node-content="{ node, data }">
            <slot name="layer-node-content" :data="data" :node="node"></slot>
          </template>

          <template #component-list-panel-header>
            <slot name="component-list-panel-header"></slot>
          </template>

          <template #component-list-item="{ component }">
            <slot name="component-list-item" :component="component"></slot>
          </template>

          <template #code-block-panel-header>
            <slot name="code-block-panel-header"></slot>
          </template>

          <template #code-block-panel-tool="{ id, data }">
            <slot name="code-block-panel-tool" :id="id" :data="data"></slot>
          </template>
        </Sidebar>
      </slot>
    </template>

    <template #workspace>
      <slot name="workspace" :editorService="editorService">
        <Workspace :stage-content-menu="stageContentMenu">
          <template #stage><slot name="stage"></slot></template>
          <template #workspace-content><slot name="workspace-content" :editorService="editorService"></slot></template>
          <template #page-bar-title="{ page }"><slot name="page-bar-title" :page="page"></slot></template>
          <template #page-bar-popover="{ page }"><slot name="page-bar-popover" :page="page"></slot></template>
        </Workspace>
      </slot>
    </template>

    <template #props-panel>
      <slot name="props-panel">
        <PropsPanel
          :extend-state="extendFormState"
          @mounted="(instance: any) => $emit('props-panel-mounted', instance)"
        >
          <template #props-panel-header>
            <slot name="props-panel-header"></slot>
          </template>
        </PropsPanel>
      </slot>
    </template>

    <template #empty><slot name="empty" :editorService="editorService"></slot></template>

    <template #content-after>
      <slot name="content-after"></slot>
    </template>

    <template #footer>
      <slot name="footer"></slot>
    </template>
  </Framework>
</template>

<script lang="ts" setup>
import { provide, reactive } from 'vue';

import { MApp } from '@tmagic/schema';

import Framework from './layouts/Framework.vue';
import TMagicNavMenu from './layouts/NavMenu.vue';
import PropsPanel from './layouts/PropsPanel.vue';
import Sidebar from './layouts/sidebar/Sidebar.vue';
import Workspace from './layouts/workspace/Workspace.vue';
import codeBlockService from './services/codeBlock';
import componentListService from './services/componentList';
import dataSourceService from './services/dataSource';
import depService from './services/dep';
import editorService from './services/editor';
import eventsService from './services/events';
import historyService from './services/history';
import keybindingService from './services/keybinding';
import propsService from './services/props';
import storageService from './services/storage';
import uiService from './services/ui';
import keybindingConfig from './utils/keybinding-config';
import { defaultEditorProps, EditorProps } from './editorProps';
import { initServiceEvents, initServiceState } from './initService';
import type { Services } from './type';

defineOptions({
  name: 'MEditor',
});

const emit = defineEmits<{
  'props-panel-mounted': [instance: InstanceType<typeof PropsPanel>];
  'update:modelValue': [value: MApp | null];
}>();

const props = withDefaults(defineProps<EditorProps>(), defaultEditorProps);

const services: Services = {
  componentListService,
  eventsService,
  historyService,
  propsService,
  editorService,
  uiService,
  storageService,
  codeBlockService,
  depService,
  dataSourceService,
  keybindingService,
};

initServiceEvents(props, emit, services);
initServiceState(props, services);
keybindingService.registe(keybindingConfig);
keybindingService.registeEl('global');

provide('services', services);

provide('codeOptions', props.codeOptions);
provide(
  'stageOptions',
  reactive({
    runtimeUrl: props.runtimeUrl,
    autoScrollIntoView: props.autoScrollIntoView,
    render: props.render,
    moveableOptions: props.moveableOptions,
    canSelect: props.canSelect,
    updateDragEl: props.updateDragEl,
    isContainer: props.isContainer,
    containerHighlightClassName: props.containerHighlightClassName,
    containerHighlightDuration: props.containerHighlightDuration,
    containerHighlightType: props.containerHighlightType,
    disabledDragStart: props.disabledDragStart,
  }),
);

defineExpose(services);
</script>
