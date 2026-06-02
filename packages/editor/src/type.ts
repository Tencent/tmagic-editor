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

import type { Component } from 'vue';
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
import type { ChangeRecord, FormConfig, TableColumnConfig, TypeFunction } from '@tmagic/form';
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
import type { UndoRedo } from './utils/undo-redo';

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
  zoom?: number;
  /** 画布双击前的钩子函数，返回 false 则阻止默认的双击行为 */
  beforeDblclick?: (event: MouseEvent) => Promise<boolean | void> | boolean | void;
}

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
export type CompareCategory = 'node' | 'data-source' | 'code-block';

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
export type HistoryOpType = 'add' | 'remove' | 'update';
// #endregion HistoryOpType

// #region StepValue
export interface StepValue {
  /** 页面信息 */
  data: { name: string; id: Id };
  opType: HistoryOpType;
  /** 操作前选中的节点 ID，用于撤销后恢复选择状态 */
  selectedBefore: Id[];
  /** 操作后选中的节点 ID，用于重做后恢复选择状态 */
  selectedAfter: Id[];
  modifiedNodeIds: Map<Id, Id>;
  /** opType 'add': 新增的节点 */
  nodes?: MNode[];
  /** opType 'add': 父节点 ID */
  parentId?: Id;
  /** opType 'add': 每个新增节点在父节点 items 中的索引 */
  indexMap?: Record<string, number>;
  /** opType 'remove': 被删除的节点及其位置信息 */
  removedItems?: { node: MNode; parentId: Id; index: number }[];
  /**
   * opType 'update': 变更前后的节点快照
   *
   * `changeRecords` 来自 form 端的 propPath/value 列表，撤销/重做时只对这些 propPath 做局部更新；
   * 缺省（未传 / 空数组）才退化为整节点替换。
   */
  updatedItems?: { oldNode: MNode; newNode: MNode; changeRecords?: ChangeRecord[] }[];
  /**
   * 调用方可选传入的人类可读描述（如「调整按钮颜色」），用于历史面板展示。
   * 不影响 undo/redo 行为；缺省时面板会根据节点 / propPath 自动生成描述。
   */
  historyDescription?: string;
}
// #endregion StepValue

// #region CodeBlockStepValue
/**
 * 代码块历史记录条目。按 codeBlock.id 分组保存到 historyState.codeBlockState。
 * - 新增：oldContent = null，newContent = 新内容
 * - 更新：oldContent / newContent 都为对应内容
 * - 删除：newContent = null，oldContent = 删除前内容
 */
export interface CodeBlockStepValue {
  /** 关联的代码块 id */
  id: Id;
  /** 变更前的代码块内容，新增时为 null */
  oldContent: CodeBlockContent | null;
  /** 变更后的代码块内容，删除时为 null */
  newContent: CodeBlockContent | null;
  /**
   * form 端 propPath/value 列表。撤销/重做时若有则按 propPath 局部更新；
   * 缺省才退化为整内容替换。新增/删除场景通常无 changeRecords。
   */
  changeRecords?: ChangeRecord[];
  /** 调用方可选传入的人类可读描述，用于历史面板展示；不影响 undo/redo 行为。 */
  historyDescription?: string;
}
// #endregion CodeBlockStepValue

// #region DataSourceStepValue
/**
 * 数据源历史记录条目。按 dataSource.id 分组保存到 historyState.dataSourceState。
 * - 新增：oldSchema = null，newSchema = 新 schema
 * - 更新：oldSchema / newSchema 都为对应 schema
 * - 删除：newSchema = null，oldSchema = 删除前 schema
 */
export interface DataSourceStepValue {
  /** 关联的数据源 id */
  id: Id;
  /** 变更前的数据源 schema，新增时为 null */
  oldSchema: DataSourceSchema | null;
  /** 变更后的数据源 schema，删除时为 null */
  newSchema: DataSourceSchema | null;
  /**
   * form 端 propPath/value 列表。撤销/重做时若有则按 propPath 局部更新；
   * 缺省才退化为整 schema 替换。新增/删除场景通常无 changeRecords。
   */
  changeRecords?: ChangeRecord[];
  /** 调用方可选传入的人类可读描述，用于历史面板展示；不影响 undo/redo 行为。 */
  historyDescription?: string;
}
// #endregion DataSourceStepValue

export interface HistoryState {
  pageId?: Id;
  pageSteps: Record<Id, UndoRedo<StepValue>>;
  canRedo: boolean;
  canUndo: boolean;
  /**
   * 代码块历史栈，按 codeBlock.id 分组（每个代码块独立一份 UndoRedo）。
   * 与页面/节点无关，支持独立 undo/redo。
   */
  codeBlockState: Record<Id, UndoRedo<CodeBlockStepValue>>;
  /**
   * 数据源历史栈，按 dataSource.id 分组（每个数据源独立一份 UndoRedo）。
   * 与页面/节点无关，支持独立 undo/redo。
   */
  dataSourceState: Record<Id, UndoRedo<DataSourceStepValue>>;
}

// #region HistoryListEntry
/**
 * 历史面板用：当前页面的一条历史步骤（包含位置和是否已应用）。
 */
export interface PageHistoryStepEntry {
  /** 步骤内容 */
  step: StepValue;
  /** 在所属栈中的索引（0 为最早） */
  index: number;
  /** 是否处于"已应用"段（即位于栈游标之前）。撤销后变为 false。 */
  applied: boolean;
  /** 是否为当前所在的步骤（栈中最近一次已应用的那一步，即 index === cursor - 1）。 */
  isCurrent?: boolean;
}

/**
 * 页面历史面板分组。
 * - 连续修改同一目标节点（updatedItems[0].oldNode.id 一致）的 'update' 步骤合并成一组；
 * - 多节点更新 / add / remove 始终独立成组（无法明确归属单一目标）。
 * - targetId 为 undefined 表示"无明确目标"（如 add/remove/多节点 update），不参与合并。
 */
export interface PageHistoryGroup {
  kind: 'page';
  /** 所属页面 id */
  pageId: Id;
  /** 该分组的操作类型 */
  opType: HistoryOpType;
  /**
   * 合并的目标节点 id；只有"单节点 update"才有值，并按此 id 与相邻同 id 的 update 合并。
   * undefined 表示该分组不可被合并（add / remove / 多节点 update）。
   */
  targetId?: Id;
  /** 目标节点的可读名（取最后一步的 newNode.name/type/id） */
  targetName?: string;
  /** 组内所有步骤，按时间正序 */
  steps: PageHistoryStepEntry[];
  /** 组内最后一步是否已应用 */
  applied: boolean;
  /** 是否为当前所在的分组（包含栈中最近一次已应用步骤的那一组）。 */
  isCurrent?: boolean;
}

/**
 * 代码块历史面板分组。
 * - 同一 codeBlockId 的栈内，相邻的 'update' 操作会合并成一个 group；
 * - 'add' / 'remove' 始终独立成组（语义上是一次性事件）。
 */
export interface CodeBlockHistoryGroup {
  kind: 'code-block';
  /** 关联的 codeBlock id */
  id: Id;
  /** 该分组的操作类型 */
  opType: HistoryOpType;
  /** 组内所有步骤，按时间正序 */
  steps: { step: CodeBlockStepValue; index: number; applied: boolean; isCurrent?: boolean }[];
  /** 组内最后一步是否已应用，用于整组的状态展示 */
  applied: boolean;
  /** 是否为当前所在的分组（包含该栈最近一次已应用步骤的那一组）。 */
  isCurrent?: boolean;
}

/**
 * 数据源历史面板分组，结构同 CodeBlockHistoryGroup。
 */
export interface DataSourceHistoryGroup {
  kind: 'data-source';
  id: Id;
  opType: HistoryOpType;
  steps: { step: DataSourceStepValue; index: number; applied: boolean; isCurrent?: boolean }[];
  applied: boolean;
  /** 是否为当前所在的分组（包含该栈最近一次已应用步骤的那一组）。 */
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

export type CustomContentMenuFunction = (
  menus: (MenuButton | MenuComponent)[],
  type: 'layer' | 'data-source' | 'viewer' | 'code-block',
) => (MenuButton | MenuComponent)[];

export interface EditorEvents {
  'root-change': [value: StoreState['root'], preValue?: StoreState['root']];
  select: [node: MNode | null];
  add: [nodes: MNode[]];
  remove: [nodes: MNode[]];
  update: [nodes: { newNode: MNode; oldNode: MNode; changeRecords?: ChangeRecord[] }[]];
  'move-layer': [offset: number | LayerOffset];
  'drag-to': [data: { targetIndex: number; configs: MNode | MNode[]; targetParent: MContainer }];
  'history-change': [data: MPage | MPageFragment];
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

/**
 * 历史记录写入相关的通用配置（codeBlock / dataSource / editor 共用）
 * - doNotPushHistory: 操作完成后是否不要将本次操作压入历史栈（撤销/重做记录），默认 false
 * - historyDescription: 入栈时附带的人类可读描述，用于历史面板展示；不影响 undo/redo 行为，缺省时面板会自动生成描述
 */
export interface HistoryOpOptions {
  doNotPushHistory?: boolean;
  historyDescription?: string;
}

/**
 * 在 HistoryOpOptions 基础上携带 form 端 propPath/value 变更记录，
 * 用于历史记录的精细化撤销/重做（按 propPath 局部 patch）。
 */
export interface HistoryOpOptionsWithChangeRecords extends HistoryOpOptions {
  changeRecords?: ChangeRecord[];
}

/**
 * DSL 修改类操作的通用配置
 * - doNotSelect: 操作后是否不要自动触发选中（不调用 this.select / this.multiSelect / stage.select / stage.multiSelect）
 * - doNotSwitchPage: 操作若会引发当前页面切换（如新增 / 删除 / 跨页移动），是否跳过这次切换
 */
export interface DslOpOptions extends HistoryOpOptions {
  doNotSelect?: boolean;
  doNotSwitchPage?: boolean;
}

/** 差异对话框的入参 */
export interface DiffDialogPayload {
  /** 表单类别 */
  category: CompareCategory;
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
}
