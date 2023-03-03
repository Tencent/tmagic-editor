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

export interface ValidateError {
  message: string;
  field: string;
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

export interface FormItem {
  /** vnode的key值，默认是遍历数组时的index */
  __key?: string | number;
  /** 表单域标签的的宽度，例如 '50px'。支持 auto。 */
  labelWidth?: string;
  className?: string;
  /** 表单组件类型 */
  type?: string | TypeFunction;
  /** 字段名 */
  name?: string | number;
  /** 额外的提示信息，和 help 类似，当提示文案同时出现时，可以使用这个。 */
  extra?: string | FilterFunction;
  /** 配置提示信息 */
  tooltip?: string | FilterFunction;
  /** 是否置灰 */
  disabled?: boolean | FilterFunction;
  /** 使用表单中的值作为key，例如配置了text，则使用model.text作为key */
  key?: string;
  /** 是否显示 */
  display?: boolean | 'expand' | FilterFunction;
  /** 值发生改变时调用的方法 */
  onChange?: OnChangeHandler;
  /** label 标签的文本 */
  text?: string;
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
}

export interface ContainerCommonConfig {
  items: FormConfig;
  onInitValue?: (
    mForm: FormState | undefined,
    data: {
      formValue: FormValue;
      initValue: FormValue;
    },
  ) => FormValue;
  extensible?: boolean;
}

export interface Rule {
  message?: string;
  /** 系统提供的验证器类型。有：string,number,boolean,method,regexp,integer,float,array,object,enum,date,url,hex,email,any */
  type?: string;
  /** 是否必填 */
  required?: boolean;
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

export interface Input {
  /** 输入框没有内容时显示的文案 */
  placeholder?: string;
}

export type TypeFunction = (
  mForm: FormState | undefined,
  data: {
    model: Record<any, any>;
  },
) => string;

type FilterFunction = (
  mForm: FormState | undefined,
  data: {
    model: Record<any, any>;
    values: Record<any, any>;
    parent?: Record<any, any>;
    formValue: Record<any, any>;
    prop: string;
    config: any;
  },
) => boolean;

type OnChangeHandler = (
  mForm: FormState | undefined,
  value: any,
  data: {
    model: Record<any, any>;
    values: Record<any, any>;
    parent?: Record<any, any>;
    formValue: Record<any, any>;
    config: any;
  },
) => any;

type DefaultValueFunction = (mForm: FormState | undefined) => any;

/**
 * 下拉选择器选项配置
 */
export interface SelectConfigOption {
  /** 选项的标签 */
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

type RemoteSelectOptionRequestFunction = (
  mForm: FormState | undefined,
  res: any,
  data: {
    model: any;
    formValue: any;
    formValues: any;
    config: any;
    postOptions: Record<string, any>;
  },
) => any;

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
export interface DaterangeConfig extends FormItem {
  type: 'daterange';
  defaultTime?: Date[];
  names?: string[];
}

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
export interface DisplayConfig extends FormItem {
  type: 'display';
  initValue?: string | number | boolean;
}

/** 文本输入框 */
export interface TextConfig extends FormItem, Input {
  type?: 'text';
  tooltip?: string;
  /** 后置元素，一般为标签或按钮 */
  append?:
    | string
    | {
        text: string;
        type: 'button';
        handler: (
          mForm: FormState | undefined,
          data: {
            model: any;
            values: any;
          },
        ) => void;
      };
}

/**
 * 文本域
 */
export interface TextareaConfig extends FormItem {
  type: 'textarea';
  placeholder?: string;
}

/**
 * 计数器
 */
export interface NumberConfig extends FormItem {
  type?: 'number';
  tooltip?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

/**
 * 隐藏域
 */
export interface HiddenConfig extends FormItem {
  type: 'hidden';
}

/**
 * 日期选择器
 */
export interface DateConfig extends FormItem, Input {
  type: 'date';
  format?: 'YYYY-MM-dd HH:mm:ss' | string;
  valueFormat?: 'YYYY-MM-dd HH:mm:ss' | string;
}

/**
 * 日期时间选择器
 */
export interface DateTimeConfig extends FormItem, Input {
  type: 'datetime';
  defaultTime?: Date[];
  format?: 'YYYY-MM-dd HH:mm:ss' | string;
  valueFormat?: 'YYYY-MM-dd HH:mm:ss' | string;
}

/**
 * 时间选择器
 */
export interface TimeConfig extends FormItem, Input {
  type: 'time';
  format?: 'HH:mm:ss' | string;
  valueFormat?: 'HH:mm:ss' | string;
}

/**
 * 单个多选框
 */
export interface CheckboxConfig extends FormItem {
  type: 'checkbox';
  activeValue?: boolean | number | string;
  inactiveValue?: boolean | number | string;
}

/**
 * 开关
 */
export interface SwitchConfig extends FormItem {
  type: 'switch';
  activeValue?: boolean | number | string;
  inactiveValue?: boolean | number | string;
}

/**
 * 单选框
 */
export interface RadioGroupConfig extends FormItem {
  type: 'radio-group';
  options: {
    value: string | number | boolean;
    text: string;
  }[];
}

/**
 * 颜色选择器
 */
export interface ColorPickConfig extends FormItem {
  type: 'colorPicker';
}

/**
 * 多选框组
 */
export interface CheckboxGroupConfig extends FormItem {
  type: 'checkbox-group';
  options:
    | {
        value: any;
        text: string;
        disabled?: boolean;
      }[]
    | Function;
}

/**
 * 下拉选择器
 */
export interface SelectConfig extends FormItem, Input {
  type: 'select';
  clearable?: boolean;
  multiple?: boolean;
  valueKey?: string;
  allowCreate?: boolean;
  group?: boolean;
  options: SelectConfigOption[] | SelectConfigGroupOption[] | SelectOptionFunction;
  remote: true;
  option: {
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
    afterRequest?: RemoteSelectOptionRequestFunction;
    afterInitRequest?: RemoteSelectOptionRequestFunction;
    beforeRequest?: (mForm: FormState | undefined, postOptions: Record<string, any>, data: any) => Record<string, any>;
    beforeInitRequest?: (
      mForm: FormState | undefined,
      postOptions: Record<string, any>,
      data: any,
    ) => Record<string, any>;
    root?: string;
    totalKey?: string;
    initRoot?: string;
    item?: RemoteSelectOptionItemFunction;
    value?: string | SelectOptionValueFunction;
    text?: string | SelectOptionTextFunction;
  };
}

/**
 * 链接
 */
export interface LinkConfig extends FormItem {
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
    | FormConfig
    | ((
        mForm: FormState | undefined,
        data: {
          model: Record<any, any>;
          values: Record<any, any>;
        },
      ) => FormConfig);
  fullscreen?: boolean;
}

/**
 * 级联选择器
 */
export interface CascaderConfig extends FormItem, Input {
  type: 'cascader';
  remote?: boolean;
  multiple?: boolean;
  options?:
    | ((
        mForm: FormState | undefined,
        data: {
          model: Record<any, any>;
          formValues: Record<any, any>;
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
  add?: {
    action: {
      method: 'post' | 'get';
      body?: Record<string, any>;
    };
  };
}

export interface DynamicFieldConfig extends FormItem {
  type: 'dynamic-field';
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

/**
 * 分组容器
 */
export interface RowConfig extends FormItem, ContainerCommonConfig {
  type: 'row';
  span: number;
}

/**
 * 标签页容器
 */
export interface TabPaneConfig {
  status?: string;
  title: string;
  lazy?: boolean;
  labelWidth?: string;
  items: FormConfig;
  onTabClick?: (mForm: FormState | undefined, tab: any, data: any) => void;
  [key: string]: any;
}
export interface TabConfig extends FormItem, ContainerCommonConfig {
  type: 'tab' | 'dynamic-tab';
  tabType?: string;
  editable?: boolean;
  dynamic?: boolean;
  tabPosition?: 'top' | 'right' | 'bottom' | 'left';
  items: TabPaneConfig[];
  onChange?: (mForm: FormState | undefined, data: any) => void;
  onTabAdd?: (mForm: FormState | undefined, data: any) => void;
  onTabRemove?: (mForm: FormState | undefined, tabName: string, data: any) => void;
  onTabClick?: (mForm: FormState | undefined, tab: any, data: any) => void;
  activeChange?: (mForm: FormState | undefined, tabName: string, data: any) => void;
}

/**
 * 分组
 */
export interface FieldsetConfig extends FormItem, ContainerCommonConfig {
  type: 'fieldset';
  checkbox?: boolean;
  expand?: boolean;
  legend?: string;
  schematic?: string;
}

/**
 * 面板容器
 */
export interface PanelConfig extends FormItem, ContainerCommonConfig {
  type: 'panel';
  expand?: boolean;
  title?: string;
  schematic?: string;
}

export interface ColumnConfig extends FormItem {
  name?: string;
  label: string;
  width?: string | number;
  sortable?: boolean;
  [key: string]: any;
}

/**
 * 表格容器
 */
export interface TableConfig extends FormItem {
  type: 'table' | 'groupList' | 'group-list';
  items: ColumnConfig[];
  tableItems?: ColumnConfig[];
  groupItems?: ColumnConfig[];
  enableToggleMode?: boolean;
  /** 最大行数 */
  max?: number;
  /** 最大高度 */
  maxHeight?: number | string;
  border?: boolean;
  /** 显示行号 */
  showIndex?: boolean;
  /** 操作栏宽度 */
  operateColWidth?: number | string;
  pagination?: boolean;
  enum?: any[];
  /** 是否显示添加按钮 */
  addable?: (mForm: FormState | undefined, data: any) => boolean | 'undefined' | boolean;
  /** 是否显示删除按钮 */
  delete?: (model: any, index: number, values: any) => boolean | boolean;
  /** 是否显示导入按钮 */
  importable?: (mForm: FormState | undefined, data: any) => boolean | 'undefined' | boolean;
  /** 是否显示checkbox */
  selection?: (mForm: FormState | undefined, data: any) => boolean | boolean | 'single';
  /** 新增的默认行 */
  defaultAdd?: (mForm: FormState | undefined, data: any) => any;
  onSelect?: (mForm: FormState | undefined, data: any) => any;
  defautSort?: SortProp;
  defaultSort?: SortProp;
  dropSort?: boolean;
  /** 是否显示全屏按钮 */
  enableFullscreen?: boolean;
  fixed?: boolean;
  itemExtra?: string | FilterFunction;
  rowKey?: string;
}

export interface GroupListConfig extends FormItem {
  type: 'table' | 'groupList' | 'group-list';
  span?: number;
  enableToggleMode?: boolean;
  items: FormConfig;
  groupItems?: FormConfig;
  tableItems?: FormConfig;
  titleKey?: string;
  itemExtra?: string | FilterFunction;
  addable?: (mForm: FormState | undefined, data: any) => boolean | 'undefined' | boolean;
  defaultAdd?: (mForm: FormState | undefined, data: any) => any;
  delete?: (model: any, index: number | string | symbol, values: any) => boolean | boolean;
  movable?: (
    mForm: FormState | undefined,
    index: number | string | symbol,
    model: any,
    groupModel: any,
  ) => boolean | boolean;
  [key: string]: any;
}

interface StepItemConfig extends FormItem, ContainerCommonConfig {
  title: string;
}

export interface StepConfig extends FormItem {
  type: 'step';
  /** 每个 step 的间距，不填写将自适应间距。支持百分比。 */
  space?: string | number;
  items: StepItemConfig[];
}

export interface ComponentConfig extends FormItem {
  type: 'component';
  id: string;
  extend: any;
  display: any;
}

export type ChildConfig =
  | FormItem
  | TabConfig
  | RowConfig
  | FieldsetConfig
  | PanelConfig
  | TableConfig
  | GroupListConfig
  | StepConfig
  | DisplayConfig
  | TextConfig
  | HiddenConfig
  | LinkConfig
  | DaterangeConfig
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
  | TextareaConfig
  | DynamicFieldConfig
  | ComponentConfig;

export type FormConfig = (ChildConfig & { [key: string]: any })[];

export type FormValue = Record<string | number, any>;
