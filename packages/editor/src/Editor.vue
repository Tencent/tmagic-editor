<template>
  <Framework :disabled-page-fragment="disabledPageFragment" :page-bar-sort-options="pageBarSortOptions">
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
        <Sidebar :data="sidebar" :layer-content-menu="layerContentMenu" :custom-content-menu="customContentMenu">
          <template #layer-panel-header>
            <slot name="layer-panel-header"></slot>
          </template>

          <template #layer-node-content="{ data }">
            <slot name="layer-node-content" :data="data"></slot>
          </template>

          <template #layer-node-label="{ data }">
            <slot name="layer-node-label" :data="data"></slot>
          </template>

          <template #layer-node-tool="{ data }">
            <slot name="layer-node-tool" :data="data"></slot>
          </template>

          <template #component-list="{ componentGroupList }">
            <slot name="component-list" :component-group-list="componentGroupList"></slot>
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

          <template #code-block-panel-search>
            <slot name="code-block-panel-search"></slot>
          </template>

          <template #data-source-panel-tool="{ data }">
            <slot name="data-source-panel-tool" :data="data"></slot>
          </template>

          <template #data-source-panel-search>
            <slot name="data-source-panel-search"></slot>
          </template>
        </Sidebar>
      </slot>
    </template>

    <template #workspace>
      <slot name="workspace" :editorService="editorService">
        <Workspace
          :disabled-stage-overlay="disabledStageOverlay"
          :stage-content-menu="stageContentMenu"
          :custom-content-menu="customContentMenu"
        >
          <template #stage><slot name="stage"></slot></template>
          <template #workspace-content><slot name="workspace-content" :editorService="editorService"></slot></template>
        </Workspace>
      </slot>
    </template>

    <template #props-panel>
      <slot name="props-panel">
        <PropsPanel
          :extend-state="extendFormState"
          :disabled-show-src="disabledShowSrc"
          @mounted="(instance: any) => $emit('props-panel-mounted', instance)"
          @form-error="(e: any) => $emit('props-form-error', e)"
          @submit-error="(e: any) => $emit('props-submit-error', e)"
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

    <template #page-bar><slot name="page-bar"></slot></template>
    <template #page-bar-title="{ page }"><slot name="page-bar-title" :page="page"></slot></template>
    <template #page-bar-popover="{ page }"><slot name="page-bar-popover" :page="page"></slot></template>
    <template #page-list-popover="{ list }"><slot name="page-list-popover" :list="list"></slot></template>
  </Framework>
</template>

<script lang="ts" setup>
import { EventEmitter } from 'events';

import { provide } from 'vue';

import type { MApp } from '@tmagic/schema';

import Framework from './layouts/Framework.vue';
import TMagicNavMenu from './layouts/NavMenu.vue';
import PropsPanel from './layouts/PropsPanel.vue';
import Sidebar from './layouts/sidebar/Sidebar.vue';
import Workspace from './layouts/workspace/Workspace.vue';
import codeBlockService from './services/codeBlock';
import componentListService from './services/componentList';
import dataSourceService from './services/dataSource';
import depService from './services/dep';
import editorService, { type EditorService } from './services/editor';
import eventsService from './services/events';
import historyService from './services/history';
import keybindingService from './services/keybinding';
import propsService from './services/props';
import stageOverlayService from './services/stageOverlay';
import storageService from './services/storage';
import uiService from './services/ui';
import keybindingConfig from './utils/keybinding-config';
import { defaultEditorProps, EditorProps } from './editorProps';
import { initServiceEvents, initServiceState } from './initService';
import type { EventBus, FrameworkSlots, PropsPanelSlots, Services, SidebarSlots, WorkspaceSlots } from './type';

defineSlots<
  FrameworkSlots &
    WorkspaceSlots &
    SidebarSlots &
    PropsPanelSlots & {
      workspace(props: { editorService: EditorService }): any;
      'workspace-content'(props: { editorService: EditorService }): any;
    }
>();

defineOptions({
  name: 'MEditor',
});

const emit = defineEmits<{
  'props-panel-mounted': [instance: InstanceType<typeof PropsPanel>];
  'update:modelValue': [value: MApp | null];
  'props-form-error': [e: any];
  'props-submit-error': [e: any];
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
  stageOverlayService,
};

initServiceEvents(props, emit, services);
initServiceState(props, services);
keybindingService.register(keybindingConfig);
keybindingService.registerEl('global');

const stageOptions = {
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
  renderType: props.renderType,
  guidesOptions: props.guidesOptions,
  disabledMultiSelect: props.disabledMultiSelect,
};

stageOverlayService.set('stageOptions', stageOptions);

provide('services', services);

provide('codeOptions', props.codeOptions);
provide('stageOptions', stageOptions);

provide<EventBus>('eventBus', new EventEmitter());

defineExpose(services);
</script>
