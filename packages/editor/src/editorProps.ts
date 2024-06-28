import type { EventOption } from '@tmagic/core';
import type { FormConfig, FormState } from '@tmagic/form';
import type { DataSourceSchema, Id, MApp, MNode } from '@tmagic/schema';
import StageCore, {
  CONTAINER_HIGHLIGHT_CLASS_NAME,
  ContainerHighlightType,
  type CustomizeMoveableOptionsCallbackConfig,
  type GuidesOptions,
  type MoveableOptions,
  RenderType,
  type UpdateDragEl,
} from '@tmagic/stage';

import type {
  ComponentGroup,
  DatasourceTypeOption,
  MenuBarData,
  MenuButton,
  MenuComponent,
  PageBarSortOptions,
  SideBarData,
  StageRect,
} from './type';

export interface EditorProps {
  /** 页面初始值 */
  modelValue?: MApp;
  /** 左侧面板中的组件类型列表 */
  componentGroupList?: ComponentGroup[];
  /** 左侧面板中的数据源类型列表 */
  datasourceList?: DatasourceTypeOption[];
  /** 左侧面板配置 */
  sidebar?: SideBarData;
  /** 顶部工具栏配置 */
  menu?: MenuBarData;
  /** 组件树右键菜单 */
  layerContentMenu?: (MenuButton | MenuComponent)[];
  /** 画布右键菜单 */
  stageContentMenu?: (MenuButton | MenuComponent)[];
  /** 中间工作区域中画布通过iframe渲染时的页面url */
  runtimeUrl?: string;
  /** 是用iframe渲染还是直接渲染 */
  renderType?: RenderType;
  /** 选中时是否自动滚动到可视区域 */
  autoScrollIntoView?: boolean;
  /** 组件的属性配置表单的dsl */
  propsConfigs?: Record<string, FormConfig>;
  /** 添加组件时的默认值 */
  propsValues?: Record<string, Partial<MNode>>;
  /** 组件联动事件选项列表 */
  eventMethodList?: Record<string, { events: EventOption[]; methods: EventOption[] }>;
  /** 添加数据源时的默认值 */
  datasourceValues?: Record<string, Partial<DataSourceSchema>>;
  /** 数据源的属性配置表单的dsl */
  datasourceConfigs?: Record<string, FormConfig>;
  datasourceEventMethodList?: Record<string, { events: EventOption[]; methods: EventOption[] }>;
  /** 画布中组件选中框的移动范围 */
  moveableOptions?: MoveableOptions | ((config?: CustomizeMoveableOptionsCallbackConfig) => MoveableOptions);
  /** 编辑器初始化时默认选中的组件ID */
  defaultSelected?: Id;
  /** 拖入画布中容器时，识别到容器后给容器根dom加上的class */
  containerHighlightClassName?: string;
  /** 拖入画布中容器时，悬停识别容器的时间 */
  containerHighlightDuration?: number;
  /** 拖入画布中容器时，识别容器的操作类型 */
  containerHighlightType?: ContainerHighlightType;
  /** 画布大小 */
  stageRect?: StageRect;
  /** monaco editor 的配置 */
  codeOptions?: { [key: string]: any };
  /** 禁用鼠标左键按下时就开始拖拽，需要先选中再可以拖拽 */
  disabledDragStart?: boolean;
  /** 标尺配置 */
  guidesOptions?: Partial<GuidesOptions>;
  /** 禁止多选 */
  disabledMultiSelect?: boolean;
  /** 禁用页面片 */
  disabledPageFragment?: boolean;
  /** 禁用双击在浮层中单独编辑选中组件 */
  disabledStageOverlay?: boolean;
  /** 禁用属性配置面板右下角显示源码的按钮 */
  disabledShowSrc?: boolean;
  /** 中间工作区域中画布渲染的内容 */
  render?: (stage: StageCore) => HTMLDivElement | Promise<HTMLDivElement>;
  /** 选中时会在画布上复制出一个大小相同的dom，实际拖拽的是这个dom，此方法用于干预这个dom的生成方式 */
  updateDragEl?: UpdateDragEl;
  /** 用于设置画布上的dom是否可以被选中 */
  canSelect?: (el: HTMLElement) => boolean | Promise<boolean>;
  /** 用于设置画布上的dom是否可以被拖入其中 */
  isContainer?: (el: HTMLElement) => boolean | Promise<boolean>;
  /** 用于自定义组件树与画布的右键菜单 */
  customContentMenu?: (menus: (MenuButton | MenuComponent)[], type: string) => (MenuButton | MenuComponent)[];
  extendFormState?: (state: FormState) => Record<string, any> | Promise<Record<string, any>>;
  /** 页面顺序拖拽配置参数 */
  pageBarSortOptions?: PageBarSortOptions;
}

export const defaultEditorProps = {
  renderType: RenderType.IFRAME,
  disabledMultiSelect: false,
  disabledPageFragment: false,
  disabledStageOverlay: false,
  containerHighlightClassName: CONTAINER_HIGHLIGHT_CLASS_NAME,
  containerHighlightDuration: 800,
  containerHighlightType: ContainerHighlightType.DEFAULT,
  disabledShowSrc: false,
  componentGroupList: () => [],
  datasourceList: () => [],
  menu: () => ({ left: [], right: [] }),
  layerContentMenu: () => [],
  stageContentMenu: () => [],
  propsConfigs: () => ({}),
  propsValues: () => ({}),
  eventMethodList: () => ({}),
  datasourceValues: () => ({}),
  datasourceConfigs: () => ({}),
  canSelect: (el: HTMLElement) => Boolean(el.id),
  isContainer: (el: HTMLElement) => el.classList.contains('magic-ui-container'),
  codeOptions: () => ({}),
};
