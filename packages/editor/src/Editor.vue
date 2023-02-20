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
import { defineComponent, onUnmounted, PropType, provide, reactive, toRaw, watch } from 'vue';

import { EventOption } from '@tmagic/core';
import type { FormConfig } from '@tmagic/form';
import type { MApp, MNode } from '@tmagic/schema';
import StageCore, {
  CONTAINER_HIGHLIGHT_CLASS_NAME,
  ContainerHighlightType,
  CustomizeMoveableOptionsCallbackConfig,
  MoveableOptions,
  UpdateDragEl,
} from '@tmagic/stage';

import Framework from './layouts/Framework.vue';
import NavMenu from './layouts/NavMenu.vue';
import PropsPanel from './layouts/PropsPanel.vue';
import Sidebar from './layouts/sidebar/Sidebar.vue';
import Workspace from './layouts/workspace/Workspace.vue';
import codeBlockService from './services/codeBlock';
import componentListService from './services/componentList';
import editorService from './services/editor';
import eventsService from './services/events';
import historyService from './services/history';
import propsService from './services/props';
import storageService from './services/storage';
import uiService from './services/ui';
import type { ComponentGroup, MenuBarData, MenuButton, MenuComponent, Services, SideBarData, StageRect } from './type';

export default defineComponent({
  name: 'm-editor',

  components: {
    TMagicNavMenu: NavMenu,
    Sidebar,
    Workspace,
    PropsPanel,
    Framework,
  },

  props: {
    /** 页面初始值 */
    modelValue: {
      type: Object as PropType<MApp>,
      default: () => ({}),
      require: true,
    },

    /** 左侧面板中的组件列表 */
    componentGroupList: {
      type: Array as PropType<ComponentGroup[]>,
      default: () => [],
    },

    /** 左侧面板配置 */
    sidebar: {
      type: Object as PropType<SideBarData>,
    },

    /** 顶部工具栏配置 */
    menu: {
      type: Object as PropType<MenuBarData>,
      default: () => ({ left: [], right: [] }),
    },

    /** 组件树右键菜单 */
    layerContentMenu: {
      type: Array as PropType<(MenuButton | MenuComponent)[]>,
      default: () => [],
    },

    /** 画布右键菜单 */
    stageContentMenu: {
      type: Array as PropType<(MenuButton | MenuComponent)[]>,
      default: () => [],
    },

    /** 中间工作区域中画布渲染的内容 */
    render: {
      type: Function as PropType<(stage: StageCore) => HTMLDivElement | Promise<HTMLDivElement>>,
    },

    /** 中间工作区域中画布通过iframe渲染时的页面url */
    runtimeUrl: String,

    /** 选中时是否自动滚动到可视区域 */
    autoScrollIntoView: Boolean,

    /** 组件的属性配置表单的dsl */
    propsConfigs: {
      type: Object as PropType<Record<string, FormConfig>>,
      default: () => ({}),
    },

    /** 添加组件时的默认值 */
    propsValues: {
      type: Object as PropType<Record<string, MNode>>,
      default: () => ({}),
    },

    /** 组件联动事件选项列表 */
    eventMethodList: {
      type: Object as PropType<Record<string, { events: EventOption[]; methods: EventOption[] }>>,
      default: () => ({}),
    },

    /** 画布中组件选中框的移动范围 */
    moveableOptions: {
      type: [Object, Function] as PropType<
        MoveableOptions | ((config?: CustomizeMoveableOptionsCallbackConfig) => MoveableOptions)
      >,
    },

    /** 编辑器初始化时默认选中的组件ID */
    defaultSelected: {
      type: [Number, String],
    },

    canSelect: {
      type: Function as PropType<(el: HTMLElement) => boolean | Promise<boolean>>,
      default: (el: HTMLElement) => Boolean(el.id),
    },

    isContainer: {
      type: Function as PropType<(el: HTMLElement) => boolean | Promise<boolean>>,
      default: (el: HTMLElement) => el.classList.contains('magic-ui-container'),
    },

    containerHighlightClassName: {
      type: String,
      default: CONTAINER_HIGHLIGHT_CLASS_NAME,
    },

    containerHighlightDuration: {
      type: Number,
      default: 800,
    },

    containerHighlightType: {
      type: String as PropType<ContainerHighlightType>,
      default: ContainerHighlightType.DEFAULT,
    },

    stageRect: {
      type: [String, Object] as PropType<StageRect>,
    },

    codeOptions: {
      type: Object,
      default: () => ({}),
    },

    updateDragEl: {
      type: Function as PropType<UpdateDragEl>,
    },

    disabledDragStart: {
      type: Boolean,
    },
  },

  emits: ['props-panel-mounted', 'update:modelValue'],

  setup(props, { emit }) {
    const rootChangeHandler = (value: MApp, preValue?: MApp | null) => {
      const nodeId = editorService.get('node')?.id || props.defaultSelected;
      let node;
      if (nodeId) {
        node = editorService.getNodeById(nodeId);
      }

      if (node && node !== value) {
        editorService.select(node.id);
      } else if (value?.items?.length) {
        editorService.select(value.items[0]);
      } else if (value?.id) {
        editorService.set('nodes', [value]);
        editorService.set('parent', null);
        editorService.set('page', null);
      }

      if (toRaw(value) !== toRaw(preValue)) {
        emit('update:modelValue', value);
      }
    };

    editorService.on('root-change', rootChangeHandler);

    // 初始值变化，重新设置节点信息
    watch(
      () => props.modelValue,
      (modelValue) => {
        editorService.set('root', modelValue);
      },
      {
        immediate: true,
      },
    );

    watch(
      () => props.componentGroupList,
      (componentGroupList) => componentListService.setList(componentGroupList),
      {
        immediate: true,
      },
    );

    watch(
      () => props.propsConfigs,
      (configs) => propsService.setPropsConfigs(configs),
      {
        immediate: true,
      },
    );

    watch(
      () => props.propsValues,
      (values) => propsService.setPropsValues(values),
      {
        immediate: true,
      },
    );

    watch(
      () => props.eventMethodList,
      (eventMethodList) => {
        const eventsList: Record<string, EventOption[]> = {};
        const methodsList: Record<string, EventOption[]> = {};

        Object.keys(eventMethodList).forEach((type: string) => {
          eventsList[type] = eventMethodList[type].events;
          methodsList[type] = eventMethodList[type].methods;
        });

        eventsService.setEvents(eventsList);
        eventsService.setMethods(methodsList);
      },
      {
        immediate: true,
      },
    );

    watch(
      () => props.defaultSelected,
      (defaultSelected) => defaultSelected && editorService.select(defaultSelected),
      {
        immediate: true,
      },
    );

    watch(
      () => props.stageRect,
      (stageRect) => stageRect && uiService.set('stageRect', stageRect),
      {
        immediate: true,
      },
    );

    onUnmounted(() => {
      editorService.resetState();
      historyService.resetState();
      propsService.resetState();
      uiService.resetState();
      componentListService.resetState();
      codeBlockService.resetState();

      editorService.off('root-change', rootChangeHandler);
    });

    const services: Services = {
      componentListService,
      eventsService,
      historyService,
      propsService,
      editorService,
      uiService,
      storageService,
      codeBlockService,
    };

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
    // 监听组件update
    codeBlockService.addCodeRelationListener();

    return services;
  },
});
</script>
