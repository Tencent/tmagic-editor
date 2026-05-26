import type { DataSourceFieldType, DataSourceSchema } from '@tmagic/schema';

import type { ContainerCommonConfig, FilterFunction, FormItem, FormItemConfig, FormState, Input } from './base';

// #region DataSourceFieldSelectConfig
export interface DataSourceFieldSelectConfig<T = never> extends FormItem {
  type: 'data-source-field-select';
  /**
   * 是否要编译成数据源的data。
   * key: 不编译，就是要数据源id和field name;
   * value: 要编译（数据源data[`${filed}`]）
   * */
  value?: 'key' | 'value';
  /** 是否严格的遵守父子节点不互相关联 */
  checkStrictly?:
    | boolean
    | ((
        mForm: FormState | undefined,
        data: {
          model: Record<any, any>;
          values: Record<any, any>;
          parent?: Record<any, any>;
          formValue: Record<any, any>;
          prop: string;
          config: DataSourceFieldSelectConfig;
          dataSource?: DataSourceSchema;
        },
      ) => boolean);
  dataSourceFieldType?: DataSourceFieldType[];
  fieldConfig?: FormItemConfig<T>;
  /** 是否可以编辑数据源，disable表示的是是否可以选择数据源 */
  notEditable?: boolean | FilterFunction;

  dataSourceId?: string;
}
// #endregion DataSourceFieldSelectConfig

// #region CodeConfig
export interface CodeConfig extends FormItem {
  type: 'vs-code';
  language?: string;
  options?: {
    [key: string]: any;
  };
  height?: string;
  parse?: boolean;
  autosize?: {
    minRows?: number;
    maxRows?: number;
  };
  mFormItemType?: string;
}
// #endregion CodeConfig

// #region CodeLinkConfig
export interface CodeLinkConfig extends FormItem {
  type: 'code-link';
  formTitle?: string;
  codeOptions?: Object;
}
// #endregion CodeLinkConfig

// #region CodeSelectConfig
export interface CodeSelectConfig extends FormItem {
  type: 'code-select';
  className?: string;
}
// #endregion CodeSelectConfig

// #region CodeSelectColConfig
export interface CodeSelectColConfig extends FormItem {
  type: 'code-select-col';
  /** 是否可以编辑代码块，disable表示的是是否可以选择代码块 */
  notEditable?: boolean | FilterFunction;
}
// #endregion CodeSelectColConfig

// #region CondOpSelectConfig
export interface CondOpSelectConfig extends FormItem {
  type: 'cond-op-select';
  parentFields?: string[];
}
// #endregion CondOpSelectConfig

// #region DataSourceFieldsConfig
export interface DataSourceFieldsConfig extends FormItem {
  type: 'data-source-fields';
}
// #endregion DataSourceFieldsConfig

// #region DataSourceInputConfig
export interface DataSourceInputConfig extends FormItem {
  type: 'data-source-input';
}
// #endregion DataSourceInputConfig

// #region DataSourceMethodsConfig
export interface DataSourceMethodsConfig extends FormItem {
  type: 'data-source-methods';
}
// #endregion DataSourceMethodsConfig

// #region DataSourceMethodSelectConfig
export interface DataSourceMethodSelectConfig extends FormItem {
  type: 'data-source-method-select';
  /** 是否可以编辑数据源，disable表示的是是否可以选择数据源 */
  notEditable?: boolean | FilterFunction;
}
// #endregion DataSourceMethodSelectConfig

// #region DataSourceMocksConfig
export interface DataSourceMocksConfig extends FormItem {
  type: 'data-source-mocks';
}
// #endregion DataSourceMocksConfig

// #region DataSourceSelect
export interface DataSourceSelect extends FormItem, Input {
  type: 'data-source-select';
  /** 数据源类型: base、http... */
  dataSourceType?: string;
  /** 是否要编译成数据源的data。
   * id: 不编译，就是要数据源id;
   * value: 要编译（数据源data）
   * */
  value?: 'id' | 'value';
  /** 是否可以编辑数据源，disable表示的是是否可以选择数据源 */
  notEditable?: boolean | FilterFunction;
}
// #endregion DataSourceSelect

// #region DisplayCondsConfig
export interface DisplayCondsConfig extends FormItem {
  type: 'display-conds';
  titlePrefix?: string;
  parentFields?: string[] | FilterFunction<string[]>;
}
// #endregion DisplayCondsConfig

// #region EventSelectConfig
export interface EventSelectConfig extends FormItem {
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
// #endregion EventSelectConfig

// #region KeyValueConfig
export interface KeyValueConfig extends FormItem {
  type: 'key-value';
  advanced?: boolean;
}
// #endregion KeyValueConfig

// #region PageFragmentSelectConfig
export interface PageFragmentSelectConfig extends FormItem {
  type: 'page-fragment-select';
}
// #endregion PageFragmentSelectConfig

// #region UISelectConfig
export interface UISelectConfig extends FormItem {
  type: 'ui-select';
}
// #endregion UISelectConfig

// #region StyleSetterConfig
export interface StyleSetterConfig extends ContainerCommonConfig {
  type: 'style-setter';
}
// #endregion StyleSetterConfig

export type EditorChildConfig<T = never> =
  | DataSourceFieldSelectConfig<T>
  | CodeConfig
  | CodeLinkConfig
  | CodeSelectConfig
  | CodeSelectColConfig
  | CondOpSelectConfig
  | DataSourceFieldsConfig
  | DataSourceInputConfig
  | DataSourceMethodsConfig
  | DataSourceMethodSelectConfig
  | DataSourceMocksConfig
  | DataSourceSelect
  | DisplayCondsConfig
  | EventSelectConfig
  | KeyValueConfig
  | PageFragmentSelectConfig
  | UISelectConfig
  | StyleSetterConfig;
