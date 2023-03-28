<template>
  <Framework :code-options="codeOptions">
    <template #nav>
      <slot name="nav" :editorService="editorService"><TMagicNavMenu :data="menu"></TMagicNavMenu></slot>
    </template>

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

          <template #code-block-edit-panel-header="{ id }">
            <slot name="code-block-edit-panel-header" :id="id"></slot>
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
        <PropsPanel @mounted="(instance: any) => $emit('props-panel-mounted', instance)">
          <template #props-panel-header>
            <slot name="props-panel-header"></slot>
          </template>
        </PropsPanel>
      </slot>
    </template>

    <template #empty><slot name="empty" :editorService="editorService"></slot></template>
  </Framework>
</template>

<script lang="ts">
import { defineComponent, provide, reactive } from 'vue';

import Framework from './layouts/Framework.vue';
import NavMenu from './layouts/NavMenu.vue';
import PropsPanel from './layouts/PropsPanel.vue';
import Sidebar from './layouts/sidebar/Sidebar.vue';
import Workspace from './layouts/workspace/Workspace.vue';
import codeBlockService from './services/codeBlock';
import componentListService from './services/componentList';
import depService from './services/dep';
import editorService from './services/editor';
import eventsService from './services/events';
import historyService from './services/history';
import propsService from './services/props';
import storageService from './services/storage';
import uiService from './services/ui';
import editorProps from './editorProps';
import { initServiceEvents, initServiceState } from './initService';
import type { Services } from './type';

export default defineComponent({
  name: 'm-editor',

  components: {
    TMagicNavMenu: NavMenu,
    Sidebar,
    Workspace,
    PropsPanel,
    Framework,
  },

  props: editorProps,

  emits: ['props-panel-mounted', 'update:modelValue'],

  setup(props, { emit }) {
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
    };

    initServiceEvents(props, emit, services);
    initServiceState(props, services);

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

    return services;
  },
});
</script>
