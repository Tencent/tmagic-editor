import type { InjectionKey } from 'vue';

import type { DataSourceSchema, EventOption, Id, MApp, MNode, MPage, MPageFragment } from '@tmagic/core';
import type { FormConfig, FormState } from '@tmagic/form';
import StageCore, {
  CONTAINER_HIGHLIGHT_CLASS_NAME,
  ContainerHighlightType,
  type CustomizeMoveableOptions,
  type GuidesOptions,
  RenderType,
  type UpdateDragEl,
} from '@tmagic/stage';
import { getIdFromEl } from '@tmagic/utils';

import type {
  CanDropInFunction,
  ComponentGroup,
  CustomContentMenuFunction,
  DatasourceTypeOption,
  HistoryListExtraTab,
  IsExpandableFunction,
  MenuBarData,
  MenuButton,
  MenuComponent,
  PageBarSortOptions,
  SideBarData,
  StageRect,
  TreeNodeData,
} from './type';

/**
 * 「属性配置表单校验」联动能力的 provide/inject 注入键。
 * 使用 Symbol 避免与其它字符串键冲突，供 PropsPanel / FormPanel 注入判断校验失败时是否仍更新节点并记录错误。
 */
export const ENABLE_PROPS_FORM_VALIDATE: InjectionKey<boolean> = Symbol('enablePropsFormValidate');

export interface EditorProps {
  /** 页面初始值 */
  modelValue?: MApp;
  /** 左侧面板中的组件类型列表 */
  componentGroupList?: ComponentGroup[];
  /** 左侧面板中的数据源类型列表 */
  datasourceList?: DatasourceTypeOption[];
  /** 左侧面板配置 */
  sidebar?: SideBarData;
  /** 是否隐藏左侧面板 */
  hideSidebar?: boolean;
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
  moveableOptions?: CustomizeMoveableOptions;
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
  /**
   * 始终启用多选模式：开启后无需按住 Ctrl/Meta，点击即多选；
   * 默认 false。当 `disabledMultiSelect` 为 true 时本配置失效
   */
  alwaysMultiSelect?: boolean;
  /** 禁用页面片 */
  disabledPageFragment?: boolean;
  /** 禁用「非点击画布选中组件时（如从图层树、面包屑等外部选中），对选中区域做高亮闪烁提示」，默认 false（即默认开启闪烁） */
  disabledFlashTip?: boolean;
  /** 禁用双击在浮层中单独编辑选中组件 */
  disabledStageOverlay?: boolean;
  /**
   * 是否启用「属性配置表单校验」联动能力：开启后属性/样式表单校验失败时仍更新节点，
   * 并把错误信息集中记录到 editorService，用于组件树标红提示与保存拦截；默认 false（关闭）。
   */
  enablePropsFormValidate?: boolean;
  /** 禁用属性配置面板右下角显示源码的按钮 */
  disabledShowSrc?: boolean;
  /** 禁用数据源 */
  disabledDataSource?: boolean;
  /** 禁用代码块 */
  disabledCodeBlock?: boolean;
  /** 已选组件、代码编辑、数据源缩进配置 */
  treeIndent?: number;
  /** 已选组件、代码编辑、数据源子节点缩进增量配置 */
  treeNextLevelIndentIncrement?: number;
  /** 中间工作区域中画布渲染的内容 */
  render?: (stage: StageCore) => HTMLDivElement | void | Promise<HTMLDivElement | void>;
  /** 选中时会在画布上复制出一个大小相同的dom，实际拖拽的是这个dom，此方法用于干预这个dom的生成方式 */
  updateDragEl?: UpdateDragEl;
  /** 用于设置画布上的dom是否可以被选中 */
  canSelect?: (el: HTMLElement) => boolean | Promise<boolean>;
  /** 用于设置画布上的dom是否可以被拖入其中 */
  isContainer?: (el: HTMLElement) => boolean | Promise<boolean>;
  /** 用于自定义组件树与画布的右键菜单 */
  customContentMenu?: CustomContentMenuFunction;
  /** 用于自定义判断组件树节点是否可展开（即是否要展示为拥有子节点的形态） */
  layerNodeIsExpandable?: IsExpandableFunction;
  /**
   * 用于自定义判断当前正在拖动的源是否可以拖入目标节点内部
   *
   * 同时覆盖以下两类场景，通过第三个参数 scene 区分：
   * - `'layer'` ："已选组件"面板组件树拖动（返回 false 时仅禁用 inner，不影响 before/after）
   * - `'stage'`：画布拖入组件（返回 false 时阻止该容器被高亮命中；适用于"组件列表拖入新组件"和"画布上拖动已有组件"两种细分情况）
   *
   * 注意：layer 场景目前只识别同步返回值；返回 Promise 时会按 true 处理（即允许）
   */
  canDropIn?: CanDropInFunction;
  /** 画布双击前的钩子函数，返回 false 则阻止默认的双击行为 */
  beforeDblclick?: (event: MouseEvent) => Promise<boolean | void> | boolean | void;
  /** 组件树节点双击前的钩子函数，返回 false 则阻止默认的双击行为 */
  beforeLayerNodeDblclick?: (event: MouseEvent, data: TreeNodeData) => Promise<boolean | void> | boolean | void;
  extendFormState?: (state: FormState) => Record<string, any> | Promise<Record<string, any>>;
  /** 历史记录面板的自定义扩展 tab，追加在内置的页面/数据源/代码块 tab 之后 */
  historyListExtraTabs?: HistoryListExtraTab[];
  /** 页面顺序拖拽配置参数 */
  pageBarSortOptions?: PageBarSortOptions;
  /** 页面搜索函数 */
  pageFilterFunction?: (page: MPage | MPageFragment, keyword: string) => boolean;
}

export const defaultEditorProps = {
  renderType: RenderType.IFRAME,
  disabledMultiSelect: false,
  alwaysMultiSelect: false,
  disabledPageFragment: false,
  disabledFlashTip: false,
  disabledStageOverlay: false,
  containerHighlightClassName: CONTAINER_HIGHLIGHT_CLASS_NAME,
  containerHighlightDuration: 800,
  containerHighlightType: ContainerHighlightType.DEFAULT,
  disabledShowSrc: false,
  disabledDataSource: false,
  disabledCodeBlock: false,
  componentGroupList: () => [],
  datasourceList: () => [],
  historyListExtraTabs: () => [],
  menu: () => ({ left: [], right: [] }),
  layerContentMenu: () => [],
  stageContentMenu: () => [],
  propsConfigs: () => ({}),
  propsValues: () => ({}),
  eventMethodList: () => ({}),
  datasourceValues: () => ({}),
  datasourceConfigs: () => ({}),
  canSelect: (el: HTMLElement) => Boolean(getIdFromEl()(el) && !el.dataset.tmagicPageFragmentContainerId),
  isContainer: (el: HTMLElement) => el.classList.contains('magic-ui-container'),
  codeOptions: () => ({}),
  customContentMenu: (menus: (MenuButton | MenuComponent)[]) => menus,
};
