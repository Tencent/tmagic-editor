/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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
import type { PascalCasedProperties } from 'type-fest';

import type { ChildConfig, ColumnConfig, FilterFunction, FormConfig, FormItem, Input } from '@tmagic/form';
import type {
  CodeBlockContent,
  CodeBlockDSL,
  DataSourceFieldType,
  Id,
  MApp,
  MContainer,
  MNode,
  MPage,
  MPageFragment,
} from '@tmagic/schema';
import type StageCore from '@tmagic/stage';
import type {
  ContainerHighlightType,
  CustomizeMoveableOptionsCallbackConfig,
  GuidesOptions,
  MoveableOptions,
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
  'page-bar-title'(props: { page: MPage | MPageFragment }): any;
  'page-bar-popover'(props: { page: MPage | MPageFragment }): any;
}

export interface WorkspaceSlots {
  stage(props: {}): any;
  'workspace-content'(props: {}): any;
}

export interface ComponentListPanelSlots {
  'component-list-panel-header'(props: {}): any;
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

export interface InstallOptions {
  parseDSL: <T = any>(dsl: string) => T;
  [key: string]: any;
}

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

export interface StageOptions {
  runtimeUrl?: string;
  autoScrollIntoView?: boolean;
  containerHighlightClassName?: string;
  containerHighlightDuration?: number;
  containerHighlightType?: ContainerHighlightType;
  disabledDragStart?: boolean;
  render?: (stage: StageCore) => HTMLDivElement | Promise<HTMLDivElement>;
  moveableOptions?: MoveableOptions | ((config?: CustomizeMoveableOptionsCallbackConfig) => MoveableOptions);
  canSelect?: (el: HTMLElement) => boolean | Promise<boolean>;
  isContainer?: (el: HTMLElement) => boolean | Promise<boolean>;
  updateDragEl?: UpdateDragEl;
  renderType?: RenderType;
  guidesOptions?: Partial<GuidesOptions>;
  disabledMultiSelect?: boolean;
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
}

export type StoreStateKey = keyof StoreState;

export interface PropsState {
  propsConfigMap: Record<string, FormConfig>;
  propsValueMap: Record<string, Partial<MNode>>;
  relateIdMap: Record<Id, Id>;
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

export enum ColumnLayout {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
}

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
  /** 是否显示标尺，true: 显示，false: 不显示，默认为true */
  showRule: boolean;
  /** 用于控制该属性配置表单内组件的尺寸 */
  propsPanelSize: 'large' | 'default' | 'small';
  /** 是否显示新增页面按钮 */
  showAddPageButton: boolean;
  /** 是否隐藏侧边栏 */
  hideSlideBar: boolean;

  // navMenu 的宽高
  navMenuRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface EditorNodeInfo {
  node: MNode | null;
  parent: MContainer | null;
  page: MPage | MPageFragment | null;
}

export interface AddMNode {
  type: string;
  name?: string;
  inputEvent?: DragEvent;
  [key: string]: any;
}

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
  disabled?: boolean | ((data?: Services) => boolean);
  /** 是否显示，默认为true */
  display?: boolean | ((data?: Services) => boolean);
  /** type为button/dropdown时点击运行的方法 */
  handler?: (data: Services, event: MouseEvent) => Promise<any> | any;
  className?: string;
  /** type为dropdown时，下拉的菜单列表， 或者有子菜单时 */
  items?: MenuButton[];
  /** 唯一标识，用于高亮 */
  id?: string | number;
}

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
  display?: boolean | ((data?: Services) => Promise<boolean> | boolean);
  [key: string]: any;
}

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
 */
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
  | MenuButton
  | MenuComponent
  | string;

/** 工具栏 */
export interface MenuBarData {
  /** 顶部工具栏左边项 */
  [ColumnLayout.LEFT]?: MenuItem[];
  /** 顶部工具栏中间项 */
  [ColumnLayout.CENTER]?: MenuItem[];
  /** 顶部工具栏右边项 */
  [ColumnLayout.RIGHT]?: MenuItem[];
}

export interface SideComponent extends MenuComponent {
  /** 显示文案 */
  text: string;
  /** vue组件或url */
  icon: Component<{}, {}, any>;
  /** slide 唯一标识 key */
  $key: string;

  /** 组件扩展参数 */
  boxComponentConfig?: {
    /** Vue3组件 */
    component?: any;
    /** 传入组件的props对象 */
    props?: Record<string, any>;
  };
}

/**
 * component-list: 组件列表
 * layer: 已选组件树
 * code-block: 代码块
 */
export type SideItem = 'component-list' | 'layer' | 'code-block' | 'data-source' | SideComponent;

/** 工具栏 */
export interface SideBarData {
  /** 容器类型 */
  type: 'tabs';
  /** 默认激活的内容 */
  status: string;
  /** panel列表 */
  items: SideItem[];
}

/**
 * drawer 抽屉
 * box 悬浮窗
 */
export type SlideType = 'drawer' | 'box';

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

export interface ComponentGroup {
  /** 显示文案 */
  title: string;
  /** 组内列表 */
  items: ComponentItem[];
}

export interface UpdateData {
  id: Id;
  [key: string]: any;
}

export enum LayerOffset {
  TOP = 'top',
  BOTTOM = 'bottom',
}

/** 容器布局 */
export enum Layout {
  FLEX = 'flex',
  FIXED = 'fixed',
  RELATIVE = 'relative',
  ABSOLUTE = 'absolute',
}

export enum Keys {
  ESCAPE = 'Space',
}

export const H_GUIDE_LINE_STORAGE_KEY = '$MagicStageHorizontalGuidelinesData';
export const V_GUIDE_LINE_STORAGE_KEY = '$MagicStageVerticalGuidelinesData';

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
  paramsColConfig?: ColumnConfig;
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
  type?: string;
  [key: string]: any;
}

export interface StepValue {
  data: MPage | MPageFragment;
  modifiedNodeIds: Map<Id, Id>;
  nodeId: Id;
}

export interface HistoryState {
  pageId?: Id;
  pageSteps: Record<Id, UndoRedo<StepValue>>;
  canRedo: boolean;
  canUndo: boolean;
}

export interface EventSelectConfig {
  name: string;
  type: 'event-select';
  src: 'datasource' | 'component';
  labelWidth?: string;
  /** 事件名称表单配置 */
  eventNameConfig?: FormItem;
  /** 动作类型配置 */
  actionTypeConfig?: FormItem;
  /** 联动组件配置 */
  targetCompConfig?: FormItem;
  /** 联动组件动作配置 */
  compActionConfig?: FormItem;
  /** 联动代码配置 */
  codeActionConfig?: FormItem;
  /** 联动数据源配置 */
  dataSourceActionConfig?: FormItem;
}

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

export interface CodeSelectColConfig extends FormItem {
  type: 'code-select-col';
  /** 是否可以编辑代码块，disable表示的是是否可以选择代码块 */
  notEditable?: boolean | FilterFunction;
}

export interface PageFragmentSelectConfig extends FormItem {
  type: 'page-fragment-select';
}

export interface DataSourceSelect extends FormItem, Input {
  type: 'data-source-select';
  /** 数据源类型: base、http... */
  dataSourceType?: string;
  /** 是否要编译成数据源的data。
   * id: 不编译，就是要数据源id;
   * value: 要编译（数据源data）
   * */
  value?: 'id' | 'value';
}

export interface DataSourceMethodSelectConfig extends FormItem {
  type: 'data-source-method-select';
  /** 是否可以编辑数据源，disable表示的是是否可以选择数据源 */
  notEditable?: boolean | FilterFunction;
}

export interface DataSourceFieldSelectConfig extends FormItem {
  type: 'data-source-field-select';
  /** 是否要编译成数据源的data。
   * key: 不编译，就是要数据源id和field name;
   * value: 要编译（数据源data[`${filed}`]）
   * */
  value?: 'key' | 'value';
  /** 是否严格的遵守父子节点不互相关联 */
  checkStrictly?: boolean;
  dataSourceFieldType?: DataSourceFieldType[];
  fieldConfig?: ChildConfig;
}

/** 可新增的数据源类型选项 */
export interface DatasourceTypeOption {
  /** 数据源类型 */
  type: string;
  /** 数据源名称 */
  text: string;
}

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

/** 当uiService.get('uiSelectMode')为true,点击组件（包括任何形式，组件树/画布）时触发的事件名 */
export const UI_SELECT_MODE_EVENT_NAME = 'ui-select';

export interface TreeNodeData {
  id: Id;
  name?: string;
  items?: TreeNodeData[];
  [key: string]: any;
}

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
