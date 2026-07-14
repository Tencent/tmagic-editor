/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { AppContext, Component } from 'vue';
import type EventEmitter from 'events';
import type * as Monaco from 'monaco-editor';
import type { default as Sortable, Options, SortableEvent } from 'sortablejs';
import type { PascalCasedProperties, Writable } from 'type-fest';

import type {
  CodeBlockContent,
  CodeBlockDSL,
  DataSourceSchema,
  Id,
  MApp,
  MContainer,
  MNode,
  MPage,
  MPageFragment,
} from '@tmagic/core';
import type { FieldSize } from '@tmagic/design';
import type { ChangeRecord, FormConfig, FormState, TableColumnConfig, TypeFunction } from '@tmagic/form';
import type StageCore from '@tmagic/stage';
import type {
  CanDropIn,
  ContainerHighlightType,
  CustomizeMoveableOptions,
  GuidesOptions,
  RenderType,
  UpdateDragEl,
} from '@tmagic/stage';

import type { CodeBlockService } from './services/codeBlock';
import type { ComponentListService } from './services/componentList';
import type { DataSourceService } from './services/dataSource';
import type { DepService } from './services/dep';
import type { EditorService } from './services/editor';
import type { EventsService } from './services/events';
import type { HistoryService } from './services/history';
import type { KeybindingService } from './services/keybinding';
import type { PropsService } from './services/props';
import type { StageOverlayService } from './services/stageOverlay';
import type { StorageService } from './services/storage';
import type { UiService } from './services/ui';
import type { SerializedUndoRedo, UndoRedo } from './utils/undo-redo';

export type EditorSlots = FrameworkSlots &
  WorkspaceSlots &
  SidebarSlots &
  PropsPanelSlots & {
    workspace(props: { editorService: EditorService }): any;
    'workspace-content'(props: { editorService: EditorService }): any;
  };

export interface FrameworkSlots {
  header(props: {}): any;
  nav(props: {}): any;
  'content-before'(props: {}): any;
  'content-after'(props: {}): any;
  'src-code'(props: {}): any;
  sidebar(props: {}): any;
  empty(props: {}): any;
  workspace(props: {}): any;
  'props-panel'(props: {}): any;
  'footer'(props: {}): any;
  'page-bar'(props: {}): any;
  'page-bar-add-button'(props: {}): any;
  'page-bar-title'(props: { page: MPage | MPageFragment }): any;
  'page-bar-popover'(props: { page: MPage | MPageFragment }): any;
  'page-list-popover'(props: { list: (MPage | MPageFragment)[] }): any;
}

export interface ScrollViewerSlots {
  before(props: {}): any;
  content(props: {}): any;
  default(props: {}): any;
}

export interface StageSlots extends ScrollViewerSlots {
  'stage-top'(props: {}): any;
}

export interface WorkspaceSlots extends StageSlots {
  stage(props: {}): any;
  'workspace-content'(props: {}): any;
}

export interface ComponentListPanelSlots {
  'component-list-panel-header'(props: {}): any;
  'component-list'(props: { componentGroupList: ComponentGroup[] }): any;
  'component-list-item'(props: { component: ComponentItem }): any;
}

export interface CodeBlockListPanelSlots extends CodeBlockListSlots {
  'code-block-panel-search'(props: {}): any;
  'code-block-panel-header'(props: {}): any;
}

export interface CodeBlockListSlots {
  'code-block-panel-tool'(props: { id: Id; data: any }): any;
}

export interface DataSourceListSlots {
  'data-source-panel-tool'(props: { data: any }): any;
  'data-source-panel-search'(props: {}): any;
}

export interface LayerNodeSlots {
  'layer-node-content'(props: { data: MNode }): any;
  'layer-node-tool'(props: { data: MNode }): any;
  'layer-node-label'(props: { data: MNode }): any;
}

export interface LayerPanelSlots extends LayerNodeSlots {
  'layer-panel-header'(props: {}): any;
}

export interface PropsPanelSlots {
  'props-panel-header'(props: {}): any;
}

export type SidebarSlots = LayerPanelSlots & CodeBlockListPanelSlots & ComponentListPanelSlots & DataSourceListSlots;

export type BeforeAdd = (config: MNode, parent: MContainer) => Promise<MNode> | MNode;
export type GetConfig = (config: FormConfig) => Promise<FormConfig> | FormConfig;

export interface EditorInstallOptions {
  parseDSL: <T = any>(dsl: string) => T;
  customCreateMonacoEditor: (
    monaco: typeof import('monaco-editor'),
    codeEditorEl: HTMLElement,
    options: Monaco.editor.IStandaloneEditorConstructionOptions & { editorCustomType?: string },
  ) => Promise<Monaco.editor.IStandaloneCodeEditor> | Monaco.editor.IStandaloneCodeEditor;
  customCreateMonacoDiffEditor: (
    monaco: typeof import('monaco-editor'),
    codeEditorEl: HTMLElement,
    options: Monaco.editor.IStandaloneDiffEditorConstructionOptions & { editorCustomType?: string },
  ) => Promise<Monaco.editor.IStandaloneDiffEditor> | Monaco.editor.IStandaloneDiffEditor;
  [key: string]: any;
}

// #region Services
export interface Services {
  editorService: EditorService;
  historyService: HistoryService;
  storageService: StorageService;
  eventsService: EventsService;
  propsService: PropsService;
  componentListService: ComponentListService;
  uiService: UiService;
  codeBlockService: CodeBlockService;
  depService: DepService;
  dataSourceService: DataSourceService;
  keybindingService: KeybindingService;
  stageOverlayService: StageOverlayService;
}
// #endregion Services

export interface StageOptions {
  runtimeUrl?: string;
  autoScrollIntoView?: boolean;
  containerHighlightClassName?: string;
  containerHighlightDuration?: number;
  containerHighlightType?: ContainerHighlightType;
  disabledDragStart?: boolean;
  render?: (stage: StageCore) => HTMLDivElement | void | Promise<HTMLDivElement | void>;
  moveableOptions?: CustomizeMoveableOptions;
  canSelect?: (el: HTMLElement) => boolean | Promise<boolean>;
  isContainer?: (el: HTMLElement) => boolean | Promise<boolean>;
  /**
   * 画布上拖入组件（包括从组件列表拖入新组件、画布上拖动已有组件）时，
   * 对已通过 isContainer 命中的候选容器进行二次过滤；返回 false 时阻止该容器被高亮命中
   * - 在画布上拖动已有组件时：sourceIds 为被拖动组件的 id 列表
   * - 从组件列表拖入新组件时：sourceIds 为空数组（尚无 id，仅可依据 targetId 判断）
   * 该选项会被透传给 StageCore 的 canDropIn
   */
  canDropIn?: CanDropIn;
  updateDragEl?: UpdateDragEl;
  renderType?: RenderType;
  guidesOptions?: Partial<GuidesOptions>;
  disabledMultiSelect?: boolean;
  /**
   * 始终启用多选模式（无需按住 Ctrl/Meta），默认 false。
   * 当 `disabledMultiSelect` 为 true 时本配置失效。
   */
  alwaysMultiSelect?: boolean;
  disabledRule?: boolean;
  /**
   * 禁用「非点击画布选中组件时（如从图层树、面包屑等外部选中），对选中区域做高亮闪烁提示」，
   * 默认 false（即默认开启闪烁）
   */
  disabledFlashTip?: boolean;
  zoom?: number;
  /** 画布双击前的钩子函数，返回 false 则阻止默认的双击行为 */
  beforeDblclick?: (event: MouseEvent) => Promise<boolean | void> | boolean | void;
}

/**
 * 节点校验错误信息，按来源（属性表单 / 样式表单）分别保存错误文案。
 * 属性表单与样式表单是两个独立的 FormPanel，均指向同一节点，故以来源为键，
 * 避免某个面板校验通过时误清另一个面板记录的错误。
 * 节点视为存在错误当且仅当任一来源存在非空文本。
 */
export interface NodeInvalidInfo {
  /** 属性表单校验错误文案（可能为包含 <br> 的 HTML） */
  props?: string;
  /** 样式表单校验错误文案（可能为包含 <br> 的 HTML） */
  style?: string;
}

/** 节点校验错误来源 */
export type NodeInvalidSource = keyof NodeInvalidInfo;

export interface StoreState {
  root: MApp | null;
  page: MPage | MPageFragment | null;
  parent: MContainer | null;
  node: MNode | null;
  highlightNode: MNode | null;
  nodes: MNode[];
  stage: StageCore | null;
  stageLoading: boolean;
  modifiedNodeIds: Map<Id, Id>;
  /** 校验失败的节点错误信息，按节点 id 存储，供组件树标记与保存拦截读取 */
  invalidNodeIds: Map<Id, NodeInvalidInfo>;
  pageLength: number;
  pageFragmentLength: number;
  disabledMultiSelect: boolean;
  /** 是否始终启用多选模式（无需按住 Ctrl/Meta） */
  alwaysMultiSelect: boolean;
}

export type StoreStateKey = keyof StoreState;

export interface PropsState {
  propsConfigMap: Record<string, FormConfig>;
  propsValueMap: Record<string, Partial<MNode>>;
  relateIdMap: Record<Id, Id>;
  /** 禁用数据源 */
  disabledDataSource: boolean;
  /** 禁用代码块 */
  disabledCodeBlock: boolean;
}

export interface StageOverlayState {
  wrapDiv: HTMLDivElement;
  sourceEl: HTMLElement | null;
  contentEl: HTMLElement | null;
  stage: StageCore | null;
  stageOptions: StageOptions | null;
  wrapWidth: number;
  wrapHeight: number;
  stageOverlayVisible: boolean;
}

export interface ComponentGroupState {
  list: ComponentGroup[];
}

// #region ColumnLayout
export enum ColumnLayout {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
}
// #endregion ColumnLayout

export interface SetColumnWidth {
  [ColumnLayout.LEFT]?: number;
  [ColumnLayout.CENTER]?: number | 'auto';
  [ColumnLayout.RIGHT]?: number;
}

export interface GetColumnWidth {
  [ColumnLayout.LEFT]: number;
  [ColumnLayout.CENTER]: number;
  [ColumnLayout.RIGHT]: number;
}

export interface StageRect {
  width: number | string;
  height: number | string;
}

export interface UiState {
  /** 当前点击画布是否触发选中，true: 不触发，false: 触发，默认为false */
  uiSelectMode: boolean;
  /** 是否显示整个配置源码， true: 显示， false: 不显示，默认为false */
  showSrc: boolean;
  /** 是否将样式配置单独一列显示， true: 显示， false: 不显示，默认为true */
  showStylePanel: boolean;
  /** 画布显示放大倍数，默认为 1 */
  zoom: number;
  /** 画布容器的宽高 */
  stageContainerRect: {
    width: number;
    height: number;
  };
  /** 画布顶层div的宽高，可用于改变画布的大小 */
  stageRect: StageRect;
  /** 编辑器列布局每一列的宽度，分为左中右三列 */
  columnWidth: GetColumnWidth;
  /** 编辑器列布局左侧列最小宽度 */
  minLeftColumnWidth: number;
  /** 编辑器列布局中间列最小宽度 */
  minCenterColumnWidth: number;
  /** 编辑器列布局右侧列最小宽度 */
  minRightColumnWidth: number;
  /** 是否显示画布参考线，true: 显示，false: 不显示，默认为true */
  showGuides: boolean;
  /** 画布上是否存在参考线 */
  hasGuides: boolean;
  /** 是否显示标尺，true: 显示，false: 不显示，默认为true */
  showRule: boolean;
  /** 用于控制该属性配置表单内组件的尺寸 */
  propsPanelSize: 'large' | 'default' | 'small';
  /** 是否显示新增页面按钮 */
  showAddPageButton: boolean;
  /** 是否在页面工具栏显示呼起页面列表按钮 */
  showPageListButton: boolean;
  /** 是否隐藏侧边栏 */
  hideSlideBar: boolean;
  /** 侧边栏面板配置 */
  sideBarItems: SideComponent[];
  /** 当前激活的侧边栏面板 */
  sideBarActiveTabName: string;

  // navMenu 的宽高
  navMenuRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  frameworkRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

// #region EditorNodeInfo
export interface EditorNodeInfo {
  node: MNode | null;
  parent: MContainer | null;
  page: MPage | MPageFragment | null;
  path: MNode[];
}
// #endregion EditorNodeInfo

export interface AddMNode {
  type: string;
  name?: string;
  inputEvent?: DragEvent;
  [key: string]: any;
}

// #region PastePosition
export interface PastePosition {
  left?: number;
  top?: number;
  /**
   * 粘贴位置X方向偏移量
   */
  offsetX?: number;
  /**
   * 粘贴位置Y方向偏移量
   */
  offsetY?: number;
}
// #endregion PastePosition

// #region MenuButton
/**
 * 菜单按钮
 */
export interface MenuButton {
  /**
   * 按钮类型
   * button: 只有文字不带边框的按钮
   * text: 纯文本
   * divider: 分割线
   * dropdown: 下拉菜单
   */
  type: 'button' | 'text' | 'divider' | 'dropdown';
  /** 当type为divider时有效，分割线方向, 默认vertical */
  direction?: 'horizontal' | 'vertical';
  /** 展示的文案 */
  text?: string;
  /** 鼠标悬浮是显示的气泡中的文案 */
  tooltip?: string;
  /** Vue组件或url */
  icon?: string | Component<{}, {}, any>;
  /** 是否置灰，默认为false */
  disabled?: boolean | ((data: Services) => boolean);
  /** 是否显示，默认为true */
  display?: boolean | ((data: Services) => boolean);
  /** type为button/dropdown时点击运行的方法 */
  handler?: (data: Services, event: MouseEvent) => Promise<any> | any;
  className?: string;
  /** type为dropdown时，下拉的菜单列表， 或者有子菜单时 */
  items?: MenuButton[];
  /** 唯一标识，用于高亮 */
  id?: string | number;
  buttonProps?: {
    type?: string;
  };
}
// #endregion MenuButton

// #region MenuComponent
export interface MenuComponent {
  type: 'component';
  /** Vue3组件 */
  component: any;
  /** 传入组件的props对象 */
  props?: Record<string, any>;
  /** 组件监听的事件对象，如：{ click: () => { console.log('click'); } } */
  listeners?: Record<string, Function>;
  slots?: Record<string, any>;
  /** 是否显示，默认为true */
  className?: string;
  display?: boolean | ((data: Services) => Promise<boolean> | boolean);
  [key: string]: any;
}
// #endregion MenuComponent

/**
 * '/': 分隔符
 * 'delete': 删除按钮
 * 'undo': 撤销按钮
 * 'redo': 恢复按钮
 * 'zoom': 'zoom-in', 'zoom-out', 'scale-to-original', 'scale-to-fit' 的集合
 * 'zoom-in': 放大按钮
 * 'zoom-out': 缩小按钮
 * 'guides': 显示隐藏参考线
 * 'rule': 显示隐藏标尺
 * 'scale-to-original': 缩放到实际大小
 * 'scale-to-fit': 缩放以适应
 * 'history-list': 历史记录面板（按 页面 / 数据源 / 代码块 三个 tab 展示，相邻同目标修改自动合并）
 */
// #region MenuItem
export type MenuItem =
  | '/'
  | 'delete'
  | 'undo'
  | 'redo'
  | 'zoom'
  | 'zoom-in'
  | 'zoom-out'
  | 'guides'
  | 'rule'
  | 'scale-to-original'
  | 'scale-to-fit'
  | 'history-list'
  | MenuButton
  | MenuComponent
  | string;
// #endregion MenuItem

// #region MenuBarData
/** 工具栏 */
export interface MenuBarData {
  /** 顶部工具栏左边项 */
  [ColumnLayout.LEFT]?: MenuItem[];
  /** 顶部工具栏中间项 */
  [ColumnLayout.CENTER]?: MenuItem[];
  /** 顶部工具栏右边项 */
  [ColumnLayout.RIGHT]?: MenuItem[];
}
// #endregion MenuBarData

// #region SideComponent
export interface SideComponent extends MenuComponent {
  /** 显示文案 */
  text: string;
  /** tab样式 */
  tabStyle?: string | Record<string, any>;
  /** vue组件或url */
  icon?: any;
  /** slide 唯一标识 key */
  $key: string;
  /** 是否可以将面板拖出，默认为true */
  draggable?: boolean;
  /** 点击切换tab前调用，返回false阻止切换 */
  beforeClick?: (config: SideComponent) => boolean | Promise<boolean>;

  /** 组件扩展参数 */
  boxComponentConfig?: {
    /** Vue3组件 */
    component?: any;
    /** 传入组件的props对象 */
    props?: Record<string, any>;
  };
}
// #endregion SideComponent

// #region HistoryListExtraTab
/**
 * 历史记录面板（HistoryListPanel）的自定义扩展 tab。
 *
 * 业务方可通过 Editor 的 `historyListExtraTabs` 注入额外的历史记录 tab，
 * 例如某个自定义模块维护自己的操作历史时，可以在历史记录面板中增加一个
 * 独立的 tab 来展示与回滚。内置的「页面 / 数据源 / 代码块」三个 tab 之后
 * 会依次追加这些扩展 tab。
 */
export interface HistoryListExtraTab {
  /** tab 唯一标识，作为 TMagicTabs 的 name */
  name: string;
  /** tab 显示文案，支持传入函数以展示动态内容（如记录数量） */
  label: string | (() => string);
  /** tab 内容区渲染的组件（Vue 组件或字符串标签） */
  component: any;
  /** 传入内容组件的 props */
  props?: Record<string, any>;
  /** 内容组件的事件监听 */
  listeners?: Record<string, (..._args: any[]) => any>;
}
// #endregion HistoryListExtraTab

// #region CompareForm
/**
 * 对比表单（CompareForm）的对比类型：
 * - node: 节点组件，按 `type` 从 propsService 获取属性表单配置
 * - data-source: 数据源，按 `type`(base/http/...) 从 dataSourceService 获取数据源表单配置
 * - code-block: 数据源代码块，使用内置的代码块表单配置
 */
export type CompareCategory = 'node' | 'data-source' | 'code-block' | string;

/**
 * 自定义 `loadConfig` 时回传的上下文，聚合了组件当前的对比入参，
 * 方便调用方在外部按需拼装 FormConfig。
 */
export interface CompareFormLoadConfigContext {
  /** 对比类型，见 CompareCategory */
  category: string;
  /** 节点 / 数据源类型 */
  type?: string;
  /** 数据源代码块场景下的数据源类型 */
  dataSourceType?: string;
  /**
   * 内置的默认 FormConfig 加载逻辑（按 `category` 从 propsService / dataSourceService /
   * 代码块工具取配置）。自定义 `loadConfig` 可调用它复用默认结果，再做二次加工。
   */
  defaultLoadConfig: () => Promise<FormConfig>;
}

/**
 * 自定义 FormConfig 加载逻辑。传入后将接管内置的按 `category` 取配置逻辑，
 * 可通过 `ctx.defaultLoadConfig()` 复用默认结果再做二次加工。
 */
export type CompareFormLoadConfig = (ctx: CompareFormLoadConfigContext) => FormConfig | Promise<FormConfig>;
// #endregion CompareForm

// #region SideItemKey
export enum SideItemKey {
  COMPONENT_LIST = 'component-list',
  LAYER = 'layer',
  CODE_BLOCK = 'code-block',
  DATA_SOURCE = 'data-source',
}
// #endregion SideItemKey

// #region SideItem
/**
 * component-list: 组件列表
 * layer: 已选组件树
 * code-block: 代码块
 */
export type SideItem = `${SideItemKey}` | SideComponent;
// #endregion SideItem

// #region SideBarData
/** 工具栏 */
export interface SideBarData {
  /** 容器类型 */
  type: 'tabs';
  /** 默认激活的内容 */
  status: string;
  /** panel列表 */
  items: SideItem[];
}
// #endregion SideBarData

// #region ComponentItem
export interface ComponentItem {
  /** 显示文案 */
  text: string;
  /** 详情，用于tooltip */
  desc?: string;
  /** 组件类型 */
  type: string;
  /** Vue组件或url */
  icon?: string | Component<{}, {}, any>;
  /** 新增组件时需要透传到组价节点上的数据 */
  data?: {
    [key: string]: any;
  };
}
// #endregion ComponentItem

// #region ComponentGroup
export interface ComponentGroup {
  /** 显示文案 */
  title: string;
  /** 组内列表 */
  items: ComponentItem[];
}
// #endregion ComponentGroup

export enum LayerOffset {
  TOP = 'top',
  BOTTOM = 'bottom',
}

// #region Layout
/** 容器布局 */
export enum Layout {
  FLEX = 'flex',
  FIXED = 'fixed',
  RELATIVE = 'relative',
  ABSOLUTE = 'absolute',
}
// #endregion Layout

export enum Keys {
  ESCAPE = 'Space',
}

export interface ScrollViewerEvent {
  scrollLeft: number;
  scrollTop: number;
  scrollHeight: number;
  scrollWidth: number;
}

export type CodeState = {
  /** 代码块DSL数据源 */
  codeDsl: CodeBlockDSL | null;
  /** 代码块是否可编辑 */
  editable: boolean;
  /** list模式下左侧展示的代码列表 */
  combineIds: string[];
  /** 为业务逻辑预留的不可删除的代码块列表，由业务逻辑维护（如代码块上线后不可删除） */
  undeletableList: Id[];
  paramsColConfig?: TableColumnConfig;
};

export type CodeRelation = {
  /** 组件id:[代码id1，代码id2] */
  [compId: Id]: Id[];
};

export interface CodeDslItem {
  /** 代码块id */
  id: Id;
  /** 代码块名称 */
  name: string;
  /** 代码块函数内容 */
  codeBlockContent?: CodeBlockContent;
  /** 是否展示代码绑定关系 */
  showRelation?: boolean;
  /** 代码块对应绑定的组件信息 */
  combineInfo?: CombineInfo[];
}

export interface CombineInfo {
  /** 组件id */
  compId: Id;
  /** 组件名称 */
  compName: string;
}

export interface ListState {
  /** 代码块列表 */
  codeList: CodeDslItem[];
}

export enum CodeDeleteErrorType {
  /** 代码块存在于不可删除列表中 */
  UNDELETEABLE = 'undeleteable',
  /** 代码块存在绑定关系 */
  BIND = 'bind',
}

// 代码块草稿localStorage key
export const CODE_DRAFT_STORAGE_KEY = 'magicCodeDraft';

export interface CodeParamStatement {
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type?: string | TypeFunction<string>;
  [key: string]: any;
}

// #region HistoryOpType
/**
 * 历史记录操作类型：
 * - `add` / `remove` / `update`：普通可撤销/重做的节点变更；
 * - `initial`：页面「未修改的初始状态」基线（设置 root 时生成），作为页面栈 index 0 的固定底线 step。
 *   该 step 不可被撤销/回滚（cursor 不会低于它），仅用于历史面板底部的初始行展示。
 */
export type HistoryOpType = 'add' | 'remove' | 'update' | 'initial';
// #endregion HistoryOpType

// #region HistoryOpSource
/**
 * 历史记录的「操作途径」——标记本次变更由哪条交互入口触发，仅用于历史面板展示 / 业务埋点，
 * 不影响 undo/redo 行为。缺省（未传）时 UI 视为「未知」。
 *
 * - `stage`：画布（拖拽 / 缩放 / 排序等舞台直接操作）
 * - `tree`：树形面板（图层 / 数据源 / 代码块等树形结构里的拖拽 / 菜单操作）
 * - `component-panel`：组件面板（左侧组件列表点击 / 拖拽新增组件）
 * - `props`：配置面板表单（属性表单字段编辑）
 * - `code`：源码编辑器（配置面板「源码」面板里直接编辑 JSON/代码后保存）
 * - `stage-contextmenu`：画布右键菜单（舞台上节点的右键上下文菜单）
 * - `tree-contextmenu`：树面板右键菜单（图层 / 数据源 / 代码块等树形列表上的右键上下文菜单）
 * - `toolbar`：工具栏菜单（顶部导航工具栏按钮）
 * - `shortcut`：键盘快捷键
 * - `rollback`：历史回滚（历史面板里对某条历史「回滚」，反向应用为一条新记录，类 git revert）
 * - `api`：代码 / 接口调用（程序化触发）
 * - `ai`：AI 生成 / 智能助手触发的变更
 * - `unknown`：未知来源
 *
 * 通过 `(string & {})` 允许业务侧扩展自定义途径字符串，同时保留内置值的自动补全。
 */
export type HistoryOpSource =
  | 'initial'
  | 'stage'
  | 'tree'
  | 'component-panel'
  | 'props'
  | 'code'
  | 'root-code'
  | 'stage-contextmenu'
  | 'tree-contextmenu'
  | 'toolbar'
  | 'shortcut'
  | 'rollback'
  | 'api'
  | 'ai'
  // 同步
  | 'sync'
  | 'unknown'
  | (string & {});
// #endregion HistoryOpSource

// #region DslOpWithHistoryIdsResult
/** *AndGetHistoryId 系列方法返回值：原操作结果 + 本次写入历史记录的 uuid 列表（未入栈时为 `[]`）。 */
export type DslOpWithHistoryIdsResult<T> = {
  result: T;
  historyIds: string[];
};
// #endregion DslOpWithHistoryIdsResult

// #region StepDiffItem
/**
 * 单条变更的 diff 描述，统一表达「页面节点 / 代码块 / 数据源」的变化内容，
 * 被 {@link StepValue} / {@link CodeBlockStepValue} / {@link DataSourceStepValue} 的 `diff` 复用。
 *
 * 按 `opType` 区分携带的字段：
 * - `add`：仅 `newSchema`（页面节点还带 `parentId` / `index`）；
 * - `remove`：仅 `oldSchema`（页面节点还带 `parentId` / `index`）；
 * - `update`：`oldSchema` + `newSchema`，并可带 `changeRecords` 做局部更新。
 *
 * 泛型 `T` 为变化内容的快照类型：页面节点为 `MNode`，代码块为 `CodeBlockContent`，数据源为 `DataSourceSchema`。
 */
export interface StepDiffItem<T = unknown> {
  /** 变更后的内容快照。`opType` 为 `add` / `update` 时有，`remove` 时无。 */
  newSchema?: T;
  /** 变更前的内容快照。`opType` 为 `remove` / `update` 时有，`add` 时无。 */
  oldSchema?: T;
  /** 父节点 id。仅页面节点有（数据源 / 代码块没有父节点）。 */
  parentId?: Id;
  /** 在父节点 items 数组中的索引。仅页面节点有（数据源 / 代码块无需排序）。 */
  index?: number;
  /**
   * form 端 propPath/value 变更列表，仅 `opType` 为 `update` 时有；
   * 撤销/重做时若有则按 propPath 局部更新，缺省才退化为整内容替换。
   */
  changeRecords?: ChangeRecord[];
}
// #endregion StepDiffItem

// #region BaseStepValue
/**
 * 历史记录条目公共字段，被 {@link StepValue} / {@link CodeBlockStepValue} / {@link DataSourceStepValue} 复用。
 *
 * 泛型 `T` 为 `diff` 中变化内容的快照类型（页面节点 `MNode` / 代码块 `CodeBlockContent` / 数据源 `DataSourceSchema`）。
 */
export interface BaseStepValue<T = unknown, U extends Record<string, any> = {}> {
  /**
   * 历史记录唯一标识（uuid）。入栈时自动写入（若调用方未指定），
   * 用于精确定位 / 引用某一条历史记录（如 revert、埋点、跨端同步等）。
   * 注意与 `data.id`（关联的页面 / 代码块 / 数据源 id）区分。
   */
  uuid: string;
  /**
   * 关联目标信息：`id` 为关联的页面 / 代码块 / 数据源等资源 id（也是历史栈的分组 key），
   * `name` 为展示名。所有历史类型统一携带。
   */
  data: { name: string; id: Id };
  /** 操作类型：新增 / 删除 / 更新（三类历史记录统一携带）。 */
  opType: HistoryOpType;
  /**
   * 本次变更的内容（统一 diff 表达），每项见 {@link StepDiffItem}。
   * 页面节点（add/remove 多节点、update 多节点）会有多项，代码块 / 数据源通常只有一项。
   */
  diff: StepDiffItem<T>[];
  /**
   * 调用方可选传入的人类可读描述（如「调整按钮颜色」），用于历史面板展示。
   * 不影响 undo/redo 行为；缺省时面板会根据节点 / propPath 自动生成描述。
   */
  historyDescription?: string;
  /**
   * 操作途径：标记本次变更由哪条交互入口触发，取值见 {@link HistoryOpSource}
   * （画布 / 树面板 / 组件面板 / 配置面板 / 源码编辑器 / 右键菜单 / 工具栏 / 快捷键 / 回滚 / 接口 等）。
   * 仅用于历史面板展示与业务埋点，不影响 undo/redo 行为；缺省时面板视为「未知」。
   */
  source?: HistoryOpSource;
  /**
   * 入栈时间戳（毫秒）。入栈时自动写入（若调用方未指定），仅用于历史面板展示。
   */
  timestamp?: number;
  /**
   * 是否为「已保存」记录：DSL 落库（如保存到后端 / 本地）时由 historyService.markSaved 标记。
   * 同一栈内任意时刻最多只有一条记录为 true；从 IndexedDB 恢复时游标会被定位到最近一条已保存记录之后。
   */
  saved?: boolean;
  /**
   * 是否为「整体设置 root」（set root）产生的记录（由 {@link Editor.pushRootDiffHistory} 写入）。
   * 用于「连续 set root 合并」：当某页栈最新一条已是 root 记录时，下一条 set root 会替换它而非新增，
   * 避免源码反复保存 / 外部重设 DSL 时堆积多条 root 记录。
   */
  rootStep?: boolean;
  /** 操作人 */
  operator?: string;
  /** 扩展信息 */
  extra?: U;
}
// #endregion BaseStepValue

// #region StepExtra
/**
 * 历史记录的扩展上下文（{@link BaseStepValue.extra}）。
 * 内置字段供 `page` 类型在撤销 / 重做时恢复选区与受影响节点；扩展类型可自由附加其它键。
 */
export interface StepExtra {
  /** 操作前选中的节点 ID，用于撤销后恢复选择状态（page 类型） */
  selectedBefore?: Id[];
  /** 操作后选中的节点 ID，用于重做后恢复选择状态（page 类型） */
  selectedAfter?: Id[];
  /** 本次操作涉及的节点 id 集合（page 类型） */
  modifiedNodeIds?: Map<Id, Id>;
  /** 操作前的节点校验错误快照，撤销后还原（使撤销一个「校验失败」的改动后错误消失） */
  invalidNodeIdsBefore?: Map<Id, NodeInvalidInfo>;
  /** 操作后的节点校验错误快照，重做后还原（使重做后错误恢复） */
  invalidNodeIdsAfter?: Map<Id, NodeInvalidInfo>;
  [key: string]: any;
}
// #endregion StepExtra

// #region StepValue
/**
 * 页面节点历史记录条目（`diff` 内容为 {@link MNode}）。结构已与代码块 / 数据源统一收敛到
 * {@link BaseStepValue}：关联 id 见 `data.id`，选区等上下文见 `extra`。
 */
export type StepValue = BaseStepValue<MNode, StepExtra>;
// #endregion StepValue

// #region CodeBlockStepValue
/**
 * 代码块历史记录条目（`diff` 内容为 {@link CodeBlockContent}），按 `data.id`（codeBlock.id）
 * 分组保存到 historyState.steps.codeBlock。结构与 {@link StepValue} / {@link DataSourceStepValue}
 * 一致，仅 `diff` 快照类型不同。
 */
export type CodeBlockStepValue = BaseStepValue<CodeBlockContent>;
// #endregion CodeBlockStepValue

// #region DataSourceStepValue
/**
 * 数据源历史记录条目（`diff` 内容为 {@link DataSourceSchema}），按 `data.id`（dataSource.id）
 * 分组保存到 historyState.steps.dataSource。结构与 {@link StepValue} / {@link CodeBlockStepValue}
 * 一致，仅 `diff` 快照类型不同。
 */
export type DataSourceStepValue = BaseStepValue<DataSourceSchema>;
// #endregion DataSourceStepValue

// #region HistorySteps
/**
 * 历史记录类型标识：内置 `page` / `codeBlock` / `dataSource`，并允许业务扩展自定义类型。
 * `(string & {})` 保留对内置字面量的智能提示，同时不限制扩展取值。
 */
export type HistoryStepType = 'page' | 'codeBlock' | 'dataSource' | (string & {});

/**
 * 全部历史栈的统一容器，按「类型 -> id -> UndoRedo 栈」两级分组。
 *
 * - `page`：页面历史栈，按 page.id 分组（每页一份 UndoRedo）；
 * - `codeBlock`：代码块历史栈，按 codeBlock.id 分组；
 * - `dataSource`：数据源历史栈，按 dataSource.id 分组；
 * - 其余键：业务通过 {@link HistoryService.registerStepType} 注册的自定义历史类型。
 *
 * 所有类型（含扩展类型）一视同仁：均按 id 独立分栈、独立 undo/redo，且都可通过
 * {@link HistoryService.setMarker} 在 index 0 种入 `initial` 基线（撤销 / 回滚不会越过该基线）。
 */
export interface HistorySteps {
  page: Record<Id, UndoRedo<StepValue>>;
  codeBlock: Record<Id, UndoRedo<CodeBlockStepValue>>;
  dataSource: Record<Id, UndoRedo<DataSourceStepValue>>;
  /** 扩展历史类型：按 id 分组的 UndoRedo 栈。 */
  [stepType: string]: Record<Id, UndoRedo<any>>;
}
// #endregion HistorySteps

export interface HistoryState {
  /**
   * 全部历史栈的统一容器（页面 / 代码块 / 数据源 / 扩展类型），见 {@link HistorySteps}。
   * 各类型互不影响，支持按 id 独立 undo/redo；是否可撤销 / 重做改用 {@link HistoryService.canUndo} /
   * {@link HistoryService.canRedo}（按 stepType + id 查询）替代旧的全局 canUndo / canRedo 字段。
   */
  steps: HistorySteps;
  /**
   * 各历史类型的展示名称，用于历史面板（{@link HistorySteps} 的 tab / 分组标题等）。
   * 内置 `page` / `codeBlock` / `dataSource` 有默认中文名（页面 / 代码块 / 数据源），
   * 扩展类型可通过 {@link HistoryService.registerStepType} 的 `name` 选项或
   * {@link HistoryService.setStepName} 登记；读取请用 {@link HistoryService.getStepName}。
   */
  stepNames: Record<string, string>;
}

// #region PersistedHistoryState
/**
 * 历史记录的可持久化快照。由 historyService.saveToIndexedDB 写入 IndexedDB，
 * 再由 historyService.restoreFromIndexedDB 读出并重建各 UndoRedo 栈。
 */
export interface PersistedHistoryState {
  /** 快照结构版本号，便于后续兼容升级。 */
  version: number;
  /**
   * 全部历史栈的序列化快照，按「类型 -> id」两级分组，与 {@link HistorySteps} 对应。
   * 内置 `page` / `codeBlock` / `dataSource`，并包含业务注册的扩展类型。
   */
  steps: {
    page: Record<Id, SerializedUndoRedo<StepValue>>;
    codeBlock: Record<Id, SerializedUndoRedo<CodeBlockStepValue>>;
    dataSource: Record<Id, SerializedUndoRedo<DataSourceStepValue>>;
    [stepType: string]: Record<Id, SerializedUndoRedo<any>>;
  };
  /** 保存时间戳（毫秒）。 */
  savedAt: number;
}
// #endregion PersistedHistoryState

// #region HistoryPersistOptions
/** historyService 持久化相关 API 的可选配置。 */
export interface HistoryPersistOptions {
  /** IndexedDB 数据库名，默认 `tmagic-editor`（最终库名会拼上当前 DSL app id）。 */
  dbName?: string;
  /** objectStore 名，默认 `history`。 */
  storeName?: string;
  /** 记录 key，用于区分不同活动页 / 项目，默认 `default`。 */
  key?: IDBValidKey;
  /**
   * 显式指定用于库名隔离的 DSL app id。
   * 缺省时回退到当前 editorService 的 `root.id`；在「先恢复历史再 set root」场景下 root 尚未设置，
   * 需由调用方（如从待加载 DSL 取 id）显式传入，否则会读 / 写到未按 app 隔离的默认库。
   */
  appId?: Id;
}
// #endregion HistoryPersistOptions

// #region HistoryListEntry
/**
 * 历史面板用：当前页面的一条历史步骤（包含位置和是否已应用）。
 */
export interface HistoryStepEntry<T> {
  /** 步骤内容 */
  step: T;
  /** 在所属栈中的索引（0 为最早） */
  index: number;
  /** 是否处于"已应用"段（即位于栈游标之前）。撤销后变为 false。 */
  applied: boolean;
  /** 是否为当前所在的步骤（栈中最近一次已应用的那一步，即 index === cursor - 1）。 */
  isCurrent?: boolean;
}

/**
 * 历史面板分组（页面 / 数据源 / 代码块 / 扩展类型统一结构）。
 *
 * 把指定历史栈的步骤列表按"目标"做相邻合并：
 * - 连续修改同一目标（单实体 update，targetId 一致）的多步合并成一组，组内可展开查看每步；
 * - add / remove / 多实体 update 始终独立成组（无法明确归属单一目标）；
 * - targetId 为 undefined 表示"无明确目标"，不参与合并。
 *
 * 各类型仅 `kind` 与 step 快照类型不同，统一由泛型描述：
 * - 页面：`HistoryGroup<StepValue>`，`kind: 'page'`，`id` 为 pageId，`targetId` 为被改节点 id；
 * - 数据源：`HistoryGroup<DataSourceStepValue>`，`kind: 'data-source'`，`id` 为 dataSource.id；
 * - 代码块：`HistoryGroup<CodeBlockStepValue>`，`kind: 'code-block'`，`id` 为 codeBlock.id。
 */
export interface HistoryGroup<T extends BaseStepValue = BaseStepValue> {
  /** 历史类型标识：page / code-block / data-source（扩展类型同理）。 */
  kind: string;
  /** 所属栈 id（page 为 pageId，代码块 / 数据源为对应资源 id）。 */
  id: Id;
  /** 该分组的操作类型。 */
  opType: HistoryOpType;
  /**
   * 合并的目标 id：仅"单实体 update"有值，并按此与相邻同 id 的 update 合并。
   * undefined 表示该分组不可被合并（add / remove / 多实体 update）。
   */
  targetId?: Id;
  /** 目标可读名（取最后一步快照的 name/type/id）。 */
  targetName?: string;
  /** 组内所有步骤，按时间正序。 */
  steps: { step: T; index: number; applied: boolean; isCurrent?: boolean }[];
  /** 组内最后一步是否已应用。 */
  applied: boolean;
  /** 是否为当前所在的分组（包含栈中最近一次已应用步骤的那一组）。 */
  isCurrent?: boolean;
}
// #endregion HistoryListEntry

export enum KeyBindingCommand {
  /** 复制 */
  COPY_NODE = 'tmagic-system-copy-node',
  /** 粘贴 */
  PASTE_NODE = 'tmagic-system-paste-node',
  /** 删除 */
  DELETE_NODE = 'tmagic-system-delete-node',
  /** 剪切 */
  CUT_NODE = 'tmagic-system-cut-node',
  /** 撤销 */
  UNDO = 'tmagic-system-undo',
  /** 重做 */
  REDO = 'tmagic-system-redo',
  /** 放大 */
  ZOOM_IN = 'tmagic-system-zoom-in',
  /** 缩小 */
  ZOOM_OUT = 'tmagic-system-zoom-out',
  /** 缩放到实际大小 */
  ZOOM_RESET = 'tmagic-system-zoom-reset',
  /** 缩放以适应 */
  ZOOM_FIT = 'tmagic-system-zoom-fit',
  /** 向上移动1px */
  MOVE_UP_1 = 'tmagic-system-move-up-1',
  /** 向下移动1px */
  MOVE_DOWN_1 = 'tmagic-system-move-down-1',
  /** 向左移动1px */
  MOVE_LEFT_1 = 'tmagic-system-move-left-1',
  /** 向右移动1px */
  MOVE_RIGHT_1 = 'tmagic-system-move-right-1',
  /** 向上移动10px */
  MOVE_UP_10 = 'tmagic-system-move-up-10',
  /** 向下移动10px */
  MOVE_DOWN_10 = 'tmagic-system-move-down-10',
  /** 向左移动10px */
  MOVE_LEFT_10 = 'tmagic-system-move-left-10',
  /** 向右移动10px */
  MOVE_RIGHT_10 = 'tmagic-system-move-right-10',
  /** 切换组件 */
  SWITCH_NODE = 'tmagic-system-switch-node',
}

export interface KeyBindingItem {
  command: KeyBindingCommand | string;
  keybinding?: string | string[];
  when: [string, 'keyup' | 'keydown'][];
}

export interface KeyBindingCacheItem {
  type: string;
  command: KeyBindingCommand | string;
  keybinding?: string | string[];
  eventType: 'keyup' | 'keydown';
  bound: boolean;
}

// #region DatasourceTypeOption
/** 可新增的数据源类型选项 */
export interface DatasourceTypeOption {
  /** 数据源类型 */
  type: string;
  /** 数据源名称 */
  text: string;
}
// #endregion DatasourceTypeOption

/** 组件树节点状态 */
export interface LayerNodeStatus {
  /** 显隐 */
  visible: boolean;
  /** 展开子节点 */
  expand: boolean;
  /** 选中 */
  selected: boolean;
  /** 是否可拖拽 */
  draggable: boolean;
}

/** 拖拽类型 */
export enum DragType {
  /** 从组件列表拖到画布 */
  COMPONENT_LIST = 'component-list',
  /** 拖动组件树节点 */
  LAYER_TREE = 'layer-tree',
}

// #region TreeNodeData
export interface TreeNodeData {
  id: Id;
  name?: string;
  items?: TreeNodeData[];
  [key: string]: any;
}
// #endregion TreeNodeData

/** 判断组件树节点是否可展开（即是否要展示为拥有子节点的形态）的函数 */
export type IsExpandableFunction = (_data: TreeNodeData, _nodeStatusMap: Map<Id, LayerNodeStatus>) => boolean;

/** canDropIn 的调用场景 */
export type CanDropInScene =
  /** 在"已选组件"面板的组件树中拖动节点 */
  | 'layer'
  /** 在画布上拖动已有组件（被拖动组件本身已经存在于画布中，sourceIds 包含其 id） */
  | 'stage-drag'
  /** 从组件列表拖入新组件到画布（被拖入的组件尚不存在，sourceIds 为空数组） */
  | 'stage-add';

/**
 * 判断当前正在拖动的源节点是否可以拖入目标节点内部的函数
 * @param _sourceIds 当前正在拖动的源节点 id 列表
 *   - `layer`：被拖动的组件树节点 id（单选时长度为 1）
 *   - `stage-drag`：被拖动组件的 id 列表（多选拖动时为多个）
 *   - `stage-add`：始终为空数组（从组件列表新增的组件尚无 id）
 * @param _targetId 目标容器的节点 id
 * @param _scene 调用场景：见 {@link CanDropInScene}
 * @returns
 *   - `false`：阻止该容器被视为合法拖入目标
 *     - `layer`：禁用 inner 高亮（before/after 仍然可用）
 *     - `stage-drag`：阻止该容器被高亮命中
 *     - `stage-add`：阻止该容器被高亮命中并退化为放入当前页面
 *   - `Id`（string | number）：将拖入目标重定向到该 id 对应的节点
 *     （例如把命中的"卡片外壳"节点重定向到其内层"卡片内容"容器节点）
 *   - 其他（`true` / `void` / `undefined`）：按原 targetId 正常拖入
 */
export type CanDropInFunction = (_sourceIds: Id[], _targetId: Id, _scene: CanDropInScene) => Id | boolean | void;

export type AsyncBeforeHook<Value extends Array<string>, C extends Record<Value[number], (...args: any) => any>> = {
  [K in Value[number]]?: (...args: Parameters<C[K]>) => Promise<Parameters<C[K]>> | Parameters<C[K]>;
};

export type AsyncAfterHook<Value extends Array<string>, C extends Record<Value[number], (...args: any) => any>> = {
  [K in Value[number]]?: (
    result: Awaited<ReturnType<C[K]>>,
    ...args: Parameters<C[K]>
  ) => ReturnType<C[K]> | Awaited<ReturnType<C[K]>>;
};

export type SyncBeforeHook<Value extends Array<string>, C extends Record<Value[number], (...args: any) => any>> = {
  [K in Value[number]]?: (...args: Parameters<C[K]>) => Parameters<C[K]>;
};

export type SyncAfterHook<Value extends Array<string>, C extends Record<Value[number], (...args: any) => any>> = {
  [K in Value[number]]?: (result: ReturnType<C[K]>, ...args: Parameters<C[K]>) => ReturnType<C[K]>;
};

export type AddPrefixToObject<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K];
};

export type AsyncHookPlugin<
  T extends Array<string>,
  C extends Record<T[number], (...args: any) => any>,
> = AddPrefixToObject<PascalCasedProperties<AsyncBeforeHook<T, C>>, 'before'> &
  AddPrefixToObject<PascalCasedProperties<AsyncAfterHook<T, C>>, 'after'>;

export type SyncHookPlugin<
  T extends Array<string>,
  C extends Record<T[number], (...args: any) => any>,
> = AddPrefixToObject<PascalCasedProperties<SyncBeforeHook<T, C>>, 'before'> &
  AddPrefixToObject<PascalCasedProperties<SyncAfterHook<T, C>>, 'after'>;

export interface EventBusEvent {
  'edit-data-source': [id: string];
  'edit-data-source-method': [id: string, methodName: string];
  'edit-data-source-field': [id: string, fieldPath: string[]];
  'remove-data-source': [id: string];
  'edit-code': [id: string];
}

export interface EventBus extends EventEmitter {
  on<Name extends keyof EventBusEvent, Param extends EventBusEvent[Name]>(
    eventName: Name,
    listener: (...args: Param) => void,
  ): this;
  emit<Name extends keyof EventBusEvent, Param extends EventBusEvent[Name]>(eventName: Name, ...args: Param): boolean;
}

// #region PropsFormConfigFunction
export type PropsFormConfigFunction = (data: { editorService: EditorService }) => FormConfig;
// #endregion PropsFormConfigFunction
export type PropsFormValueFunction = (data: { editorService: EditorService }) => Partial<MNode>;

// #region PageBarSortOptions
export type PartSortableOptions = Omit<Options, 'onStart' | 'onUpdate'>;
export interface PageBarSortOptions extends PartSortableOptions {
  /** 在onUpdate之后调用 */
  afterUpdate?: (event: SortableEvent, sortable: Sortable) => void | Promise<void>;
  /** 在onStart之前调用 */
  beforeStart?: (event: SortableEvent, sortable: Sortable) => void | Promise<void>;
}
// #endregion PageBarSortOptions

/**
 * 右键菜单当前目标（侧栏树节点等）。
 * 数据源 / 代码块面板通过 `customContentMenu` 的 `getTarget` 暴露，业务在 handler 内自行读取。
 */
export interface ContentMenuTarget {
  /** 目标 ID */
  id: string;
  /** 原始节点数据（树节点等） */
  data?: TreeNodeData;
}

export type ContentMenuType = 'layer' | 'data-source' | 'viewer' | 'code-block';

export type CustomContentMenuFunction = (
  menus: (MenuButton | MenuComponent)[],
  type: ContentMenuType,
  /** 读取当前右键目标；数据源 / 代码块面板会传入，图层 / 画布一般不需要 */
  getTarget?: () => ContentMenuTarget | null,
) => (MenuButton | MenuComponent)[];

export interface EditorEvents {
  'root-change': [
    value: StoreState['root'],
    preValue?: StoreState['root'],
    options?: { historySource?: HistoryOpSource },
  ];
  select: [node: MNode | null];
  add: [nodes: MNode[]];
  remove: [nodes: MNode[]];
  update: [nodes: { newNode: MNode; oldNode: MNode; changeRecords?: ChangeRecord[] }[]];
  'move-layer': [offset: number | LayerOffset];
  'drag-to': [data: { targetIndex: number; configs: MNode | MNode[]; targetParent: MContainer }];
  'history-change': [data: MPage | MPageFragment];
  /**
   * DSL 发生变更后统一触发，免去分别监听 add / remove / update / move-layer / drag-to。
   * 回调参数为 {@link EditorChangeEvent}，按 `type` 区分操作类型并携带各自的操作内容（payload）
   * 以及变更所在的当前 page（可能为 null）。撤销 / 重做内部同样会经由
   * add / remove / update 触发本事件；如需区分「用户操作」与「撤销重做」请配合 `history-change`。
   */
  change: [event: EditorChangeEvent];
  /** 节点校验错误状态发生变化时触发，携带当前完整的错误 Map（供非响应式消费方订阅） */
  'invalid-node-change': [invalidNodeIds: Map<Id, NodeInvalidInfo>];
}

// #region EditorChangeEvent
/** `change` 事件中单个变更项：变更的 node 及其所属的 page（可能为 null）。 */
export interface EditorChangeItem {
  node: MNode;
  page: StoreState['page'];
}

/** `update` 类型变更项：node 为前后快照及 form 端变更记录，page 为其所属页面。 */
export interface EditorUpdateChangeItem {
  node: { newNode: MNode; oldNode: MNode; changeRecords?: ChangeRecord[] };
  page: StoreState['page'];
}

/**
 * {@link EditorEvents.change} 的回调参数：以 `type` 区分操作类型，并携带对应的操作内容。
 * `data` 为本次变更的节点列表，每项包含 node 及其所属的 page（可能为 null）；
 * `move-layer` 额外带层级偏移 `offset`，`drag-to` 额外带目标位置 `targetIndex` / `targetParent`。
 */
export type EditorChangeEvent =
  | { type: 'add'; data: EditorChangeItem[] }
  | { type: 'remove'; data: EditorChangeItem[] }
  | { type: 'update'; data: EditorUpdateChangeItem[] }
  | { type: 'move-layer'; data: EditorChangeItem[]; offset: number | LayerOffset }
  | { type: 'drag-to'; data: EditorChangeItem[]; targetIndex: number; targetParent: MContainer };
// #endregion EditorChangeEvent

export interface HistoryEvents {
  change: [
    state: BaseStepValue | StepValue | CodeBlockStepValue | DataSourceStepValue,
    stepType: HistoryStepType,
    id: Id,
  ];
  'code-block-history-change': [id: Id, state: CodeBlockStepValue];
  'data-source-history-change': [id: Id, state: DataSourceStepValue];
  'restore-from-indexed-db': [snapshot: PersistedHistoryState | null];
  'save-to-indexed-db': [snapshot: PersistedHistoryState];
  'mark-saved': [{ kind: HistoryStepType; id?: Id }];
  clear: [{ id: Id; stepType: HistoryStepType }];
  'marker-change': [{ id: Id; marker: StepValue; stepType: HistoryStepType }];
}

export const canUsePluginMethods = {
  async: [
    'getLayout',
    'highlight',
    'select',
    'multiSelect',
    'doAdd',
    'add',
    'doRemove',
    'remove',
    'doUpdate',
    'update',
    'sort',
    'copy',
    'paste',
    'doPaste',
    'doAlignCenter',
    'alignCenter',
    'moveLayer',
    'moveToContainer',
    'dragTo',
    'undo',
    'redo',
    'move',
  ] as const,
  sync: [],
};

export type AsyncMethodName = Writable<(typeof canUsePluginMethods)['async']>;

// #region HistoryOpOptions
/**
 * 历史记录写入相关的通用配置（codeBlock / dataSource / editor 共用）
 * - doNotPushHistory: 操作完成后是否不要将本次操作压入历史栈（撤销/重做记录），默认 false
 * - historyDescription: 入栈时附带的人类可读描述，用于历史面板展示；不影响 undo/redo 行为，缺省时面板会自动生成描述
 * - historySource: 操作途径，取值见 {@link HistoryOpSource}（画布 / 树面板 / 组件面板 / 配置面板 / 源码编辑器 / 右键菜单 / 工具栏 / 快捷键 / 回滚 / 接口 等），用于历史面板展示与埋点；不影响 undo/redo 行为
 */
export interface HistoryOpOptions {
  doNotPushHistory?: boolean;
  historyDescription?: string;
  historySource?: HistoryOpSource;
}
// #endregion HistoryOpOptions

// #region HistoryOpOptionsWithChangeRecords
/**
 * 在 HistoryOpOptions 基础上携带 form 端 propPath/value 变更记录，
 * 用于历史记录的精细化撤销/重做（按 propPath 局部 patch）。
 */
export interface HistoryOpOptionsWithChangeRecords extends HistoryOpOptions {
  changeRecords?: ChangeRecord[];
}
// #endregion HistoryOpOptionsWithChangeRecords

// #region DslOpOptions
/**
 * DSL 修改类操作的通用配置
 * - doNotSelect: 操作后是否不要自动触发选中（不调用 this.select / this.multiSelect / stage.select / stage.multiSelect）
 * - doNotSwitchPage: 操作若会引发当前页面切换（如新增 / 删除 / 跨页移动），是否跳过这次切换
 */
export interface DslOpOptions extends HistoryOpOptions {
  doNotSelect?: boolean;
  doNotSwitchPage?: boolean;
}
// #endregion DslOpOptions

/** 差异对话框的入参 */
export interface DiffDialogPayload {
  /** 表单类别 */
  category?: CompareCategory;
  /** 节点类型 / 数据源类型 */
  type?: string;
  /** 代码块场景下的数据源类型 */
  dataSourceType?: string;
  /** 该 step 修改前的值（oldNode / oldSchema / oldContent） */
  lastValue: Record<string, any>;
  /** 该 step 修改后的值（newNode / newSchema / newContent） */
  value: Record<string, any>;
  /** 当前编辑器中实际的最新值；不传或为 null 时禁用「与当前对比」 */
  currentValue?: Record<string, any> | null;
  /** 用于标题展示的目标名称 */
  targetLabel?: string;
  /** 用于标题展示的目标 id */
  id?: string | number;
  /**
   * 指定打开时的初始对比模式：
   * - before：该步骤修改前 vs 修改后
   * - current：该步骤修改后 vs 当前最新值
   * 不传时按是否存在「修改后的值」/「当前值」自动推断。
   * 若指定的模式当前不可用（对应数据缺失），将回退到自动推断结果。
   */
  mode?: 'before' | 'current';
}

/**
 * 一组「描述 + 可操作性」的判定函数集合。页面 / 数据源 / 代码块及业务自定义历史
 * 各自实现一份，作为整体注入，避免把 describe* / isStep* 拆成多个独立 props 反复透传。
 */
export interface HistoryRowDescriptor<T extends BaseStepValue = BaseStepValue> {
  /**
   * 组级描述文案生成器，接收一个 group，返回展示文本。
   * 不传时回退到对组内最后一步调用 {@link describeStep}（适用于不做相邻合并、每组恒为单步的历史，如数据源/代码块）。
   */
  describeGroup?: (_group: any) => string;
  /** 单步描述文案生成器，接收一个 step，返回展示文本（合并组展开后的子步列表用）。 */
  describeStep: (_step: T) => string;
  /** 判断某个 step 是否可查看差异（前后值都存在）。不传则一律不展示差异入口。 */
  isStepDiffable?: (_step: T) => boolean;
  /** 判断某个 step 是否支持回滚（如更新需带 changeRecords）。不传则已应用即可回滚。 */
  isStepRevertable?: (_step: T) => boolean;
}

/**
 * 通用 bucket（数据源 / 代码块 / 业务自定义历史）的整体渲染配置。
 * 把原先散落在 Bucket / BucketTab 上的 title / prefix / describe* / isStep* / showInitial / gotoEnabled
 * 收敛成一个对象作为单一 prop 传递，调用方一次配齐、组件内部按需读取。
 */
export interface HistoryBucketConfig<T extends BaseStepValue = BaseStepValue> extends HistoryRowDescriptor<T> {
  /** bucket 头部标题，例如 "数据源" / "代码块"。 */
  title: string;
  /** 子项 key 的命名空间前缀（`ds` 数据源 / `cb` 代码块 / 业务自定义如 `mod`）。 */
  prefix: string;
  /** 是否展示底部「回到初始状态」入口，默认 true。无 undo cursor 语义的自定义历史可传 false。 */
  showInitial?: boolean;
  /** 是否支持「跳转到该记录」(goto)，默认 true。 */
  gotoEnabled?: boolean;
  /** 是否展示顶部「清空」按钮，默认 true。无需提供清空能力的自定义历史可传 false。 */
  showClear?: boolean;
}

export interface UseHistoryRevertOptions {
  /**
   * 父级应用上下文，用于让动态挂载的「差异确认弹窗」继承全局组件 / 指令 / provide / 插件
   * （Element Plus、@tmagic/form 字段组件等）。未显式传入时，会自动取调用方所在组件的 appContext
   * （`getCurrentInstance()?.appContext`）。业务方若在组件 setup 之外调用，需手动传入（如 `editorApp._context`）。
   */
  appContext?: AppContext | null;
  /**
   * 透传给差异确认弹窗的 `extendState`（即 Editor 的 `extendFormState`），
   * 使对比表单中依赖业务上下文的 `display` / `disabled` 等 filterFunction 正常工作。
   */
  extendState?: (_state: FormState) => Record<string, any> | Promise<Record<string, any>>;
  /**
   * 返回 PropsPanel 主属性表单（FormPanel -> MForm）的 formState。
   * 仅页面历史「查看差异 / 回滚确认」场景会使用该 formState 覆盖 CompareForm 中同名扩展字段，
   * 以保证两处 filterFunction 读取到一致的运行态上下文。
   */
  getPropsPanelFormState?: () => FormState | undefined;
  /**
   * 内置页面 / 数据源 / 代码块的差异 / 回滚确认弹窗默认宽度（透传给 TMagicDialog 的 `width`），
   * 如 `'1200px'` / `'80%'`。缺省时使用弹窗内置默认宽度（900px）。
   * 业务自有历史（`viewDiff` / `confirmAndRevert`）可在调用时通过各自入参的 `width` 单独覆盖。
   */
  dialogWidth?: string;
}

/**
 * 业务自有历史（如管理台「模块」）做差异对比时所需的额外渲染入参。
 * 内置的页面 / 数据源 / 代码块按 `category` 自动取表单配置，无需传这些；
 * 业务自有类别可通过 `loadConfig` 注入自定义表单配置加载逻辑。
 */
export interface CustomDiffFormOptions {
  /**
   * 自定义差异表单配置加载逻辑（如「模块」按 c_type 重建表单配置），
   * 透传给弹窗内部的 CompareForm；缺省时按 `category` 走内置加载。
   */
  loadConfig?: CompareFormLoadConfig;
  /** 需要走 self diff 的字段类型（如模块的 mod-cond）。 */
  selfDiffFieldTypes?: string[];
  /**
   * 可选：外部提供的 formState（通常来自 PropsPanel 主表单），
   * 对比弹窗会用它覆盖 CompareForm 中同名扩展字段，避免上下文不一致。
   */
  compareFormState?: FormState;
  /**
   * 差异 / 确认回滚弹窗宽度（透传给 HistoryDiffDialog 的 TMagicDialog `width`），
   * 如 `'1200px'` / `'80%'`。缺省时使用弹窗内置默认宽度（900px）。
   */
  width?: string;
  /**
   * 差异 / 确认回滚弹窗内 form 表单的尺寸（透传给 CompareForm 的 `size`），
   * 可选 `'large' | 'default' | 'small'`，缺省时使用表单内置默认尺寸。
   */
  size?: FieldSize;
}

/**
 * 业务自有历史复用「单步回滚」交互（{@link useHistoryRevert} 的 `confirmAndRevert`）的入参。
 * 与内置页面 / 数据源 / 代码块回滚共用「目标校验 → 差异/二次确认弹窗 → 反向回滚」流程，
 * 业务方只需提供：差异弹窗入参（可选）、表单配置加载（可选）、实际回滚执行函数。
 */
export interface ConfirmAndRevertOptions<T = unknown> extends CustomDiffFormOptions {
  /**
   * 差异确认弹窗入参；可对比的步骤（单实体 update）传入后弹差异确认弹窗，
   * 传 null / 省略则退化为普通二次确认框（add / remove / 不可对比）。
   */
  diffPayload?: DiffDialogPayload | null;
  /** 回滚前置校验：返回 true 表示目标数据已删除等不可回滚，给出统一提示并中止。 */
  isTargetMissing?: () => boolean;
  /** 用户确认后执行的实际回滚逻辑。 */
  revert: () => T | Promise<T>;
}
