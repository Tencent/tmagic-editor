import type { PropType } from 'vue';

import type { EventOption } from '@tmagic/core';
import type { FormConfig } from '@tmagic/form';
import type { MApp, MNode } from '@tmagic/schema';
import StageCore, {
  CONTAINER_HIGHLIGHT_CLASS_NAME,
  ContainerHighlightType,
  CustomizeMoveableOptionsCallbackConfig,
  MoveableOptions,
  UpdateDragEl,
} from '@tmagic/stage';

import type { ComponentGroup, MenuBarData, MenuButton, MenuComponent, SideBarData, StageRect } from './type';

export default {
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
};
