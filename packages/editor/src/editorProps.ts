import type { EventOption } from '@tmagic/core';
import type { CustomTargetOptions } from '@tmagic/dep';
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
  /** 中间工作区域中画布渲染的内容 */
  render?: (stage: StageCore) => HTMLDivElement | Promise<HTMLDivElement>;
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
  canSelect?: (el: HTMLElement) => boolean | Promise<boolean>;
  isContainer?: (el: HTMLElement) => boolean | Promise<boolean>;
  containerHighlightClassName?: string;
  containerHighlightDuration?: number;
  containerHighlightType?: ContainerHighlightType;
  stageRect?: StageRect;
  codeOptions?: { [key: string]: any };
  updateDragEl?: UpdateDragEl;
  disabledDragStart?: boolean;
  extendFormState?: (state: FormState) => Record<string, any> | Promise<Record<string, any>>;
  /** 自定义依赖收集器，复制组件时会将关联依赖一并复制 */
  collectorOptions?: CustomTargetOptions;
  guidesOptions?: Partial<GuidesOptions>;
}

export const defaultEditorProps = {
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
  containerHighlightClassName: CONTAINER_HIGHLIGHT_CLASS_NAME,
  containerHighlightDuration: 800,
  containerHighlightType: ContainerHighlightType.DEFAULT,
  codeOptions: () => ({}),
  renderType: RenderType.IFRAME,
};
