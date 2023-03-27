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
import { CodeBlockContent, Id, MApp, MNode, MPage } from '@tmagic/schema';
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
import depService from './services/dep';
import editorService from './services/editor';
import eventsService from './services/events';
import historyService from './services/history';
import propsService from './services/props';
import storageService from './services/storage';
import uiService from './services/ui';
import { createCodeBlockTarget } from './utils/dep';
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
    const rootChangeHandler = async (value: MApp, preValue?: MApp | null) => {
      const nodeId = editorService.get('node')?.id || props.defaultSelected;
      let node;
      if (nodeId) {
        node = editorService.getNodeById(nodeId);
      }

      if (node && node !== value) {
        await editorService.select(node.id);
      } else if (value?.items?.length) {
        await editorService.select(value.items[0]);
      } else if (value?.id) {
        editorService.set('nodes', [value]);
        editorService.set('parent', null);
        editorService.set('page', null);
      }

      if (toRaw(value) !== toRaw(preValue)) {
        emit('update:modelValue', value);
      }

      value.codeBlocks = value.codeBlocks || {};

      codeBlockService.setCodeDsl(value.codeBlocks);

      depService.removeTargets('code-block');

      Object.entries(value.codeBlocks).forEach(([id, code]) => {
        depService.addTarget(createCodeBlockTarget(id, code));
      });

      if (value && Array.isArray(value.items)) {
        depService.collect(value.items, true);
      } else {
        depService.clear();
      }
    };

    const nodeAddHandler = (nodes: MNode[]) => {
      depService.collect(nodes);
    };

    const nodeUpdateHandler = (nodes: MNode[]) => {
      depService.collect(nodes);
    };

    const nodeRemoveHandler = (nodes: MNode[]) => {
      depService.clear(nodes);
    };

    const historyChangeHandler = (page: MPage) => {
      depService.collect([page], true);
    };

    editorService.on('history-change', historyChangeHandler);
    editorService.on('root-change', rootChangeHandler);
    editorService.on('add', nodeAddHandler);
    editorService.on('remove', nodeRemoveHandler);
    editorService.on('update', nodeUpdateHandler);

    const codeBlockAddOrUpdateHandler = (id: Id, codeBlock: CodeBlockContent) => {
      if (depService.hasTarget(id)) {
        depService.getTarget(id)!.name = codeBlock.name;
        return;
      }

      depService.addTarget(createCodeBlockTarget(id, codeBlock));
    };

    const codeBlockRemoveHandler = (id: Id) => {
      depService.removeTarget(id);
    };

    codeBlockService.on('addOrUpdate', codeBlockAddOrUpdateHandler);
    codeBlockService.on('remove', codeBlockRemoveHandler);

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

    onUnmounted(() => {
      editorService.resetState();
      historyService.resetState();
      propsService.resetState();
      uiService.resetState();
      componentListService.resetState();
      codeBlockService.resetState();

      editorService.off('history-change', historyChangeHandler);
      editorService.off('root-change', rootChangeHandler);
      editorService.off('add', nodeAddHandler);
      editorService.off('remove', nodeRemoveHandler);
      editorService.off('update', nodeUpdateHandler);

      codeBlockService.off('addOrUpdate', codeBlockAddOrUpdateHandler);
      codeBlockService.off('remove', codeBlockRemoveHandler);
    });

    return services;
  },
});
</script>
