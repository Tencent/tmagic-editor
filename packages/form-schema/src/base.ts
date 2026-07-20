import type { EditorChildConfig } from './editor';

type ElMessageBoxShortcutMethod = ((
  message: string,
  title: string,
  options?: any,
  appContext?: any | null,
) => Promise<any>) &
  ((message: string, options?: any, appContext?: any | null) => Promise<any>);

// #region ChangeRecord
export interface ChangeRecord {
  propPath?: string;
  value: any;
}
// #endregion ChangeRecord

// #region OnChangeHandlerData
export interface OnChangeHandlerData {
  model: FormValue;
  values?: Readonly<FormValue> | null;
  parent?: FormValue;
  formValue?: FormValue;
  config: Readonly<any>;
  prop: string;
  changeRecords: ChangeRecord[];
  setModel: (prop: string, value: any) => void;
  setFormValue: (prop: string, value: any) => void;
}
// #endregion OnChangeHandlerData

// #region FormValue
export type FormValue = Record<string | number, any>;
// #endregion FormValue

// #region OnChangeHandler
export type OnChangeHandler = (mForm: FormState | undefined, value: any, data: OnChangeHandlerData) => any;
// #endregion OnChangeHandler

type DefaultValueFunction = (mForm: FormState | undefined) => any;

export interface FieldProps<T = any> {
  config: T;
  model: any;
  initValues?: any;
  values?: any;
  name: string;
  prop: string;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
  lastValues?: Record<string, any>;
  isCompare?: boolean;
}

/**
 * 整个表单的数据，会注入到各个组件中去
 */
export type FormState = {
  config: FormConfig;
  popperClass?: string;
  initValues: FormValue;
  lastValues: FormValue;
  isCompare: boolean;
  values: FormValue;
  $emit: (event: string, ...args: any[]) => void;
  keyProp?: string;
  parentValues?: FormValue;
  setField: (prop: string, field: any) => void;
  getField: (prop: string) => any;
  deleteField: (prop: string) => any;
  $messageBox: {
    alert: ElMessageBoxShortcutMethod;
    confirm: ElMessageBoxShortcutMethod;
    prompt: ElMessageBoxShortcutMethod;
    close(): void;
  };
  $message: {
    success: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
    error: (msg: string) => void;
    closeAll: () => void;
  };
  [key: string]: any;
};

/**
 * 排序配置
 */
export interface SortProp {
  /** 跟该值排序 */
  prop: string;
  order: 'ascending' | 'descending';
}

// #region ToolTipConfigType
export type ToolTipConfigType = string | { text?: string; placement?: string };
// #endregion ToolTipConfigType

// #region FormItem
export interface FormItem {
  /** vnode的key值，默认是遍历数组时的index */
  __key?: string | number;
  /** 表单域标签的的宽度，例如 '50px'。支持 auto。 */
  labelWidth?: string | number;
  /** label 标签的title属性 */
  labelTitle?: string;
  className?: string;
  /** 字段名 */
  name?: string | number;
  /** 额外的提示信息，和 help 类似，当提示文案同时出现时，可以使用这个。 */
  extra?: string | FilterFunction<string>;
  /** 配置提示信息 */
  tooltip?: ToolTipConfigType | FilterFunction<ToolTipConfigType>;
  /** 是否置灰 */
  disabled?: boolean | FilterFunction;
  /** 使用表单中的值作为key，例如配置了text，则使用model.text作为key */
  key?: string;
  /** 是否显示 */
  display?: boolean | 'expand' | FilterFunction<boolean | 'expand'>;
  /** 值发生改变时调用的方法 */
  onChange?: OnChangeHandler;
  /** label 标签的文本 */
  text?: string | FilterFunction<string>;
  /** 右侧感叹号 */
  tip?: string;

  filter?: 'number' | OnChangeHandler;
  /** 是否去除首尾空格 */
  trim?: boolean;
  /** 默认值 */
  defaultValue?: any | DefaultValueFunction;
  /** 表单验证规则 */
  rules?: Rule[];
  extensible?: boolean;
  dynamicKey?: string;
  /** 是否需要显示`展开更多配置` */
  expand?: boolean;
  style?: Record<string, any>;
  fieldStyle?: Record<string, any>;
  labelPosition?: 'top' | 'left' | 'right';
}
// #endregion FormItem

// #region DynamicTypeConfig
export interface DynamicTypeConfig extends FormItem {
  type: TypeFunction;
  [key: string]: any;
}
// #endregion DynamicTypeConfig

// #region ContainerCommonConfig
export interface ContainerCommonConfig<T = never> extends FormItem {
  items: FormConfig<T>;
  onInitValue?: (
    mForm: FormState | undefined,
    data: {
      formValue: FormValue;
      initValue: FormValue;
    },
  ) => FormValue;
  extensible?: boolean;
}
// #endregion ContainerCommonConfig

// #region Rule
export interface Rule {
  message?: string;
  /** 系统提供的验证器类型。有：string,number,boolean,method,regexp,integer,float,array,object,enum,date,url,hex,email,any */
  type?: string;
  /** 是否按字段 config.type 校验值类型/选项匹配 */
  typeMatch?: boolean;
  /** 是否必填 */
  required?: boolean;
  trigger?: string;
  /** 自定义验证器 */
  validator?: (
    options: {
      rule: string;
      value: any;
      callback: Function;
      source: Object;
      options: {
        messages: string;
      };
    },
    data: {
      /** 表单的初始值 */
      values: FormValue;
      /** 当前作用域下的值 */
      model: FormValue;
      parent: FormValue;
      /** 整个表单的值 */
      formValue: FormValue;
      prop: string;
      config: any;
    },
    mForm: FormState | undefined,
  ) => void;
}
// #endregion Rule

// #region Input
export interface Input {
  /** 输入框没有内容时显示的文案 */
  placeholder?: string;
}
// #endregion Input

export type TypeFunction<T extends string = string> = (
  mForm: FormState | undefined,
  data: {
    model: FormValue;
  },
) => T;

// #region FilterFunction
export type FilterFunction<T = boolean> = (
  mForm: FormState | undefined,
  data: {
    model: FormValue;
    values: FormValue;
    parent?: FormValue;
    formValue: FormValue;
    prop: string;
    config: any;
    index?: number;
    getFormValue: (prop: string) => any;
  },
) => T;
// #endregion FilterFunction

/**
 * 下拉选择器选项配置
 */
export interface SelectConfigOption {
  /** 选项的标签 */
  label?: string | SelectOptionTextFunction;
  text: string | SelectOptionTextFunction;
  /** 选项的值 */
  value: any | SelectOptionValueFunction;
  /** 是否禁用该选项 */
  disabled?: boolean;
}

export interface SelectOption {
  /** 选项的标签 */
  text: string;
  /** 选项的值 */
  value: any;
  /** 是否禁用该选项 */
  disabled?: boolean;
}

/**
 * 下拉选择器分组选项配置
 */
export interface SelectConfigGroupOption {
  /** 分组的组名 */
  label: string;
  /** 是否禁用该选项组 */
  disabled: boolean;
  options: {
    /** 选项的标签 */
    label: string | SelectOptionTextFunction;
    /** 选项的值 */
    value: any | SelectOptionValueFunction;
    /** 是否禁用该选项 */
    disabled?: boolean;
  }[];
}

export interface SelectGroupOption {
  /** 分组的组名 */
  label: string;
  /** 是否禁用该选项组 */
  disabled: boolean;
  options: {
    /** 选项的标签 */
    label?: string;
    text?: string;
    /** 选项的值 */
    value: any;
    /** 是否禁用该选项 */
    disabled?: boolean;
  }[];
}

type SelectOptionFunction = (
  mForm: FormState | undefined,
  data: {
    model: any;
    prop?: string;
    formValues: any;
    formValue: any;
    config: any;
  },
) => SelectOption[] | SelectGroupOption[];

type RemoteSelectOptionBodyFunction = (
  mForm: FormState | undefined,
  data: {
    model: any;
    formValue: any;
    formValues: any;
    config: any;
  },
) => Record<string, any>;

type RemoteSelectOptionAfterRequestFunction = (
  mForm: FormState | undefined,
  res: any,
  data: {
    model: any;
    formValue: any;
    formValues: any;
    config: any;
    prop: string;
    postOptions: Record<string, any>;
  },
) => any | Promise<any>;

type RemoteSelectOptionBeforeRequestFunction = (
  mForm: FormState | undefined,
  postOptions: Record<string, any>,
  data: {
    model: any;
    formValue: any;
    formValues: any;
    config: any;
    prop: string;
  },
) => Record<string, any> | Promise<Record<string, any>>;

type RemoteSelectOptionItemFunction = (optionsData: Record<string, any>) => SelectOption[] | SelectGroupOption[];
type SelectOptionValueFunction = (item: Record<string, any>) => any;
type SelectOptionTextFunction = (item: Record<string, any>) => string;

export interface CascaderOption {
  /** 指定选项的值为选项对象的某个属性值 */
  value: any;
  /** 指定选项标签为选项对象的某个属性值 */
  label: string;
  /** 指定选项的子选项为选项对象的某个属性值 */
  children?: CascaderOption[];
}

/**
 * 日期范围
 */
// #region DaterangeConfig
export interface DaterangeConfig extends FormItem {
  type: 'daterange';
  defaultTime?: Date[];
  names?: string[];
  valueFormat?: string;
  dateFormat?: string;
  timeFormat?: string;
}
// #endregion DaterangeConfig

/**
 * html编辑器
 */
export interface HtmlField extends FormItem {
  type: 'html';
  /** 是否异步加载编辑的内容 */
  asyncLoad?: {
    name: string | number;
  };
}

/** 展示文本，不可编辑 */
// #region DisplayConfig
export interface DisplayConfig extends FormItem {
  type: 'display';
  initValue?: string | number | boolean;
  displayText?: FilterFunction<string> | string;
}
// #endregion DisplayConfig

/** 文本输入框 */
// #region TextConfig
export interface TextConfig extends FormItem, Input {
  type?: 'text';
  tooltip?: string;
  /** 是否可清空 */
  clearable?: boolean;
  prepend?: string;
  /** 后置元素，一般为标签或按钮 */
  append?:
    | string
    | {
        text: string;
        value?: 0 | 1;
        type: 'button';
        handler?: (
          mForm: FormState | undefined,
          data: {
            model: any;
            values?: Readonly<FormValue> | null;
            formValue?: FormValue;
            setModel: (prop: string, value: any) => void;
            setFormValue: (prop: string, value: any) => void;
          },
        ) => void | Promise<void>;
      };
}
// #endregion TextConfig

/**
 * 文本域
 */
// #region TextareaConfig
export interface TextareaConfig extends FormItem {
  type: 'textarea';
  placeholder?: string;
  rows?: number;
}
// #endregion TextareaConfig

/**
 * 计数器
 */
// #region NumberConfig
export interface NumberConfig extends FormItem {
  type?: 'number';
  tooltip?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}
// #endregion NumberConfig

/**
 * 数值范围
 */
// #region NumberRangeConfig
export interface NumberRangeConfig extends FormItem {
  type?: 'number-range';
  clearable?: boolean;
}
// #endregion NumberRangeConfig

/**
 * 隐藏域
 */
// #region HiddenConfig
export interface HiddenConfig extends FormItem {
  type: 'hidden';
}
// #endregion HiddenConfig

/**
 * 日期选择器
 */
// #region DateConfig
export interface DateConfig extends FormItem, Input {
  type: 'date';
  format?: 'YYYY-MM-dd HH:mm:ss' | string;
  valueFormat?: 'YYYY-MM-dd HH:mm:ss' | string;
}
// #endregion DateConfig

/**
 * 日期时间选择器
 */
// #region DateTimeConfig
export interface DateTimeConfig extends FormItem, Input {
  type: 'datetime';
  defaultTime?: Date[];
  format?: 'YYYY-MM-dd HH:mm:ss' | string;
  valueFormat?: 'YYYY-MM-dd HH:mm:ss' | string;
}
// #endregion DateTimeConfig

/**
 * 时间选择器
 */
// #region TimeConfig
export interface TimeConfig extends FormItem, Input {
  type: 'time';
  format?: 'HH:mm:ss' | string;
  valueFormat?: 'HH:mm:ss' | string;
}
// #endregion TimeConfig

/**
 * 时间范围选择器
 */
// #region TimerangeConfig
export interface TimerangeConfig extends FormItem {
  type: 'timerange';
  names?: string[];
  defaultTime?: Date[];
  format?: 'HH:mm:ss' | string;
  valueFormat?: 'HH:mm:ss' | string;
}
// #endregion TimerangeConfig

/**
 * 单个多选框
 */
// #region CheckboxConfig
export interface CheckboxConfig extends FormItem {
  type: 'checkbox';
  activeValue?: number | string;
  inactiveValue?: number | string;
  useLabel?: boolean;
}
// #endregion CheckboxConfig

/**
 * 开关
 */
// #region SwitchConfig
export interface SwitchConfig extends FormItem {
  type: 'switch';
  activeValue?: boolean | number | string;
  inactiveValue?: boolean | number | string;
}
// #endregion SwitchConfig

/**
 * 单选框
 */
// #region RadioGroupConfig
export interface RadioGroupConfig extends FormItem {
  type: 'radio-group' | 'radioGroup';
  childType?: 'default' | 'button';
  options: {
    value: string | number | boolean;
    text?: string;
    icon?: any;
    tooltip?: string;
  }[];
}
// #endregion RadioGroupConfig

/**
 * 颜色选择器
 */
// #region ColorPickConfig
export interface ColorPickConfig extends FormItem {
  type: 'colorPicker';
}
// #endregion ColorPickConfig

export interface CheckboxGroupOption {
  value: any;
  text: string;
  disabled?: boolean;
}

/**
 * 多选框组
 */
// #region CheckboxGroupConfig
export interface CheckboxGroupConfig extends FormItem {
  type: 'checkbox-group' | 'checkboxGroup';
  options: CheckboxGroupOption[] | FilterFunction<CheckboxGroupOption[]>;
}
// #endregion CheckboxGroupConfig

/**
 * 下拉选择器
 */
// #region SelectConfig
export interface SelectConfig extends FormItem, Input {
  type: 'select';
  clearable?: boolean;
  multiple?: boolean;
  valueKey?: string;
  allowCreate?: boolean;
  filterable?: boolean;
  group?: boolean;
  options?: SelectConfigOption[] | SelectConfigGroupOption[] | SelectOptionFunction;
  remote?: true;
  option?: {
    url: string | ((mForm: FormState | undefined, data: { model: any; formValue: any }) => string);
    initUrl?: string | ((mForm: FormState | undefined, data: { model: any; formValue: any }) => string);
    method?: 'jsonp' | string;
    cache?: boolean;
    timeout?: number;
    mode?: string;
    headers?: {
      [key: string]: string;
    };
    json?: false | boolean;
    body?: Record<string, any> | RemoteSelectOptionBodyFunction;
    initBody?: Record<string, any> | RemoteSelectOptionBodyFunction;
    jsonpCallback?: 'callback' | string;
    afterRequest?: RemoteSelectOptionAfterRequestFunction;
    afterInitRequest?: RemoteSelectOptionAfterRequestFunction;
    beforeRequest?: RemoteSelectOptionBeforeRequestFunction;
    beforeInitRequest?: RemoteSelectOptionBeforeRequestFunction;
    root?: string;
    totalKey?: string;
    initRoot?: string;
    item?: RemoteSelectOptionItemFunction;
    value?: string | SelectOptionValueFunction;
    text?: string | SelectOptionTextFunction;
  };
}
// #endregion SelectConfig

/**
 * 链接
 */
// #region LinkConfig
export interface LinkConfig<T = never> extends FormItem {
  type: 'link';
  href?: string | ((model: Record<string, any>) => string);
  css?: {
    [key: string]: string | number;
  };
  disabledCss?: {
    [key: string]: string | number;
  };
  formTitle?: string;
  formWidth?: number | string;
  displayText?:
    | ((
        mForm: FormState | undefined,
        data: {
          model: Record<any, any>;
        },
      ) => string)
    | string;
  form:
    | FormConfig<T>
    | ((
        mForm: FormState | undefined,
        data: {
          model: Record<any, any>;
          values?: Readonly<FormValue> | null;
          formValue?: FormValue;
        },
      ) => FormConfig<T>);
  fullscreen?: boolean;
}
// #endregion LinkConfig

/**
 * 级联选择器
 */
// #region CascaderConfig
export interface CascaderConfig extends FormItem, Input {
  type: 'cascader';
  remote?: boolean;
  /** 在选中节点改变时，是否返回由该节点所在的各级菜单的值所组成的数组，若设置 false，则只返回该节点的值，默认 true */
  emitPath?: boolean;
  /** 是否多选，默认 false */
  multiple?: boolean;
  /** 是否严格的遵守父子节点不互相关联，默认 false */
  checkStrictly?: boolean | FilterFunction<boolean>;
  /** 弹出内容的自定义类名 */
  popperClass?: string;
  /** 合并成字符串时的分隔符 */
  valueSeparator?: string | FilterFunction<string>;
  options?:
    | ((
        mForm: FormState | undefined,
        data: {
          model: Record<any, any>;
          prop: string;
          formValue: Record<any, any>;
        },
      ) => CascaderOption[])
    | CascaderOption[];
  option?: {
    url: string;
    cache?: boolean;
    timeout?: number;
    body?: Record<string, any> | RemoteSelectOptionBodyFunction;
    root: 'string';
    item: (optionsData: Record<string, any>) => CascaderOption[];
  };
}
// #endregion CascaderConfig

// #region DynamicFieldConfig
export interface DynamicFieldConfig extends FormItem {
  type: 'dynamic-field' | 'dynamicField';
  returnFields: (
    config: DynamicFieldConfig,
    model: Record<any, any>,
    request: Object,
  ) => {
    name: string;
    label: string;
    defaultValue: string;
  }[];
  dynamicKey: string;
}
// #endregion DynamicFieldConfig

/**
 * 分组容器
 */
// #region RowConfig
export interface RowConfig<T = never> extends FormItem {
  type: 'row';
  span: number;
  items: ({ span?: number } & (ChildConfig<T> | EditorChildConfig | T))[];
}
// #endregion RowConfig

/**
 * 标签页容器
 */
// #region TabPaneConfig
export interface TabPaneConfig<T = never> {
  status?: string;
  /** 标签页名称，用于关联 model 中的数据 */
  name?: string | number;
  title: string;
  lazy?: boolean;
  labelWidth?: string;
  items: FormConfig<T>;
  display?: boolean | 'expand' | FilterFunction<boolean | 'expand'>;
  onTabClick?: (mForm: FormState | undefined, tab: any, data: any) => void;
}
// #endregion TabPaneConfig

// #region TabConfig
export interface TabConfig<T = never> extends FormItem, ContainerCommonConfig<T> {
  type: 'tab' | 'dynamic-tab';
  tabType?: string;
  editable?: boolean;
  dynamic?: boolean;
  tabPosition?: 'top' | 'right' | 'bottom' | 'left';
  /** 当前激活的标签页，可以是固定值或动态函数 */
  active?:
    | string
    | ((mForm: FormState | undefined, data: { model: FormValue; formValue?: FormValue; prop: string }) => string);
  items: TabPaneConfig<T>[];
  onChange?: (mForm: FormState | undefined, data: any) => void;
  onTabAdd?: (mForm: FormState | undefined, data: any) => void;
  onTabRemove?: (mForm: FormState | undefined, tabName: string, data: any) => void;
  onTabClick?: (mForm: FormState | undefined, tab: any, data: any) => void;
  activeChange?: (mForm: FormState | undefined, tabName: string, data: any) => void;
}
// #endregion TabConfig

/**
 * 分组
 */
// #region FieldsetConfig
export interface FieldsetConfig<T = never> extends FormItem, ContainerCommonConfig<T> {
  type: 'fieldset';
  checkbox?:
    | boolean
    | {
        name: string;
        trueValue?: string | number;
        falseValue?: string | number;
      };
  expand?: boolean;
  legend?: string | FilterFunction<string>;
  schematic?: string;
}
// #endregion FieldsetConfig

/**
 * 面板容器
 */
// #region PanelConfig
export interface PanelConfig<T = never> extends FormItem, ContainerCommonConfig<T> {
  type: 'panel';
  expand?: boolean;
  title?: string;
  schematic?: string;
}
// #endregion PanelConfig

// #region TableGroupListCommonConfig
export interface TableGroupListCommonConfig extends FormItem {
  type: 'table' | 'groupList' | 'group-list';
  enableToggleMode?: boolean;
  /** 最大行数 */
  max?: number;
  enum?: any[];
  /** 是否显示添加按钮 */
  addable?: (mForm: FormState | undefined, data: any) => boolean | 'undefined' | boolean;
  /** 新增的默认行，可以是函数动态生成或静态对象 */
  defaultAdd?: ((mForm: FormState | undefined, data: any) => any) | Record<string, any>;
  /** table 新增行时前置回调 */
  beforeAddRow?: (mForm: FormState | undefined, data: any) => boolean | Promise<boolean>;
}
// #endregion TableGroupListCommonConfig

// #region TableColumnConfig
export interface TableColumnConfig<T = never> extends FormItem {
  name?: string;
  label?: string;
  text?: string;
  width?: string | number;
  sortable?: boolean;
  items?: FormConfig<T>;
  itemsFunction?: (row: any) => FormConfig<T>;
  titleTip?: FilterFunction<string>;
  type?: string;
  addButtonConfig?: {
    props?: Record<string, any>;
    text?: string;
  };
}
// #endregion TableColumnConfig

/**
 * 表格容器
 */
// #region TableConfig
export interface TableConfig<T = never> extends TableGroupListCommonConfig {
  items: TableColumnConfig<T>[];
  tableItems?: TableColumnConfig<T>[];
  groupItems?: TableColumnConfig<T>[];
  /** 最大高度 */
  maxHeight?: number | string;
  border?: boolean;
  /** 显示行号 */
  showIndex?: boolean;
  /** 操作栏宽度 */
  operateColWidth?: number | string;
  pagination?: boolean;
  /** 是否显示删除按钮 */
  delete?: (model: any, index: number, values: any) => boolean | boolean;
  copyable?: (model: any, data: any) => boolean | boolean;
  /** 是否显示导入按钮 */
  importable?: (mForm: FormState | undefined, data: any) => boolean | 'undefined' | boolean;
  /** 是否显示checkbox */
  selection?: (mForm: FormState | undefined, data: any) => boolean | boolean | 'single';
  copyHandler?: (mForm: FormState | undefined, data: any) => any;
  onSelect?: (mForm: FormState | undefined, data: any) => any;
  /** @deprecated 请使用 defaultSort */
  defautSort?: SortProp;
  defaultSort?: SortProp;
  /** 是否支持拖拽排序 */
  dropSort?: boolean;
  dropSortHandle?: boolean;
  dropActionButtonIcon?: any;
  copyActionButtonIcon?: any;
  deleteActionButtonIcon?: any;
  /** 是否显示全屏按钮 */
  enableFullscreen?: boolean;
  fixed?: boolean | 'left' | 'right';
  itemExtra?: string | FilterFunction<string>;
  titleTip?: FilterFunction<string>;
  rowKey?: string;
  sort?: boolean;
  sortKey?: string;
}
// #endregion TableConfig

// #region GroupListConfig
export interface GroupListConfig<T = never> extends TableGroupListCommonConfig {
  span?: number;
  items: FormConfig<T>;
  groupItems?: FormConfig<T>;
  tableItems?: FormConfig<T>;
  titleKey?: string;
  titlePrefix?: string;
  title?: string | FilterFunction<string>;
  itemExtra?: string | FilterFunction<string>;
  expandAll?: boolean;
  /**
   * 默认展开的数量，用于控制分组列表默认展示的项数
   * 当设置为数字时，表示默认展开指定数量的项
   * 当未设置时，默认展开第一项
   */
  defaultExpandQuantity?: number;
  delete?: (model: any, index: number | string | symbol, values: any) => boolean | boolean;
  copyable?: FilterFunction<boolean>;
  movable?: (
    mForm: FormState | undefined,
    index: number | string | symbol,
    model: any,
    groupModel: any,
  ) => boolean | boolean;
  moveSpecifyLocation?: boolean;
}
// #endregion GroupListConfig

interface StepItemConfig<T = never> extends FormItem, ContainerCommonConfig<T> {
  title: string;
}

// #region StepConfig
export interface StepConfig<T = never> extends FormItem {
  type: 'step';
  /** 每个 step 的间距，不填写将自适应间距。支持百分比。 */
  space?: string | number;
  items: StepItemConfig<T>[];
}
// #endregion StepConfig

export interface ImgUploadConfig extends FormItem {
  type: 'img-upload';
}

// #region ComponentConfig
export interface ComponentConfig extends FormItem {
  type: 'component';
  id: string;
  extend?: any;
  display?: any;
  component?: any;
}
// #endregion ComponentConfig

// #region FlexLayoutConfig
export interface FlexLayoutConfig<T = never> extends FormItem, ContainerCommonConfig<T> {
  type: 'flex-layout';
  /** flex 子项间距，默认 '16px' */
  gap?: string;
}
// #endregion FlexLayoutConfig

// #region ChildConfig
export type ChildConfig<T = never> =
  | ContainerCommonConfig<T>
  | TabConfig<T>
  | RowConfig<T>
  | FieldsetConfig<T>
  | PanelConfig<T>
  | TableConfig
  | GroupListConfig<T>
  | StepConfig<T>
  | DisplayConfig
  | TextConfig
  | NumberConfig
  | NumberRangeConfig
  | HiddenConfig
  | LinkConfig<T>
  | DaterangeConfig
  | TimerangeConfig
  | SelectConfig
  | CascaderConfig
  | HtmlField
  | DateConfig
  | ColorPickConfig
  | TimeConfig
  | DateTimeConfig
  | CheckboxConfig
  | SwitchConfig
  | RadioGroupConfig
  | CheckboxGroupConfig
  | TextareaConfig
  | DynamicFieldConfig
  | ComponentConfig
  | FlexLayoutConfig<T>;
// #endregion ChildConfig

// #region FormItemConfig
export type FormItemConfig<T = never> = ChildConfig<T> | DynamicTypeConfig | EditorChildConfig<T> | T;
// #endregion FormItemConfig

// #region FormConfig
export type FormConfig<T = never> = FormItemConfig<T>[];
// #endregion FormConfig
