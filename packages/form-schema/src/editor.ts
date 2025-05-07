import type { DataSourceFieldType, DataSourceSchema } from '@tmagic/schema';

import type { ChildConfig, FilterFunction, FormItem, FormState, Input } from './base';

export interface DataSourceFieldSelectConfig extends FormItem {
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
  fieldConfig?: ChildConfig;
  /** 是否可以编辑数据源，disable表示的是是否可以选择数据源 */
  notEditable?: boolean | FilterFunction;
}

export interface CodeConfig extends FormItem {
  type: 'code';
  language?: string;
  options?: {
    [key: string]: any;
  };
  height?: string;
  parse?: boolean;
}

export interface CodeLinkConfig extends FormItem {
  type: 'code-link';
  formTitle?: string;
  codeOptions?: Object;
}

export interface CodeSelectConfig extends FormItem {
  type: 'code-select';
  className?: string;
}

export interface CodeSelectColConfig extends FormItem {
  type: 'code-select-col';
  /** 是否可以编辑代码块，disable表示的是是否可以选择代码块 */
  notEditable?: boolean | FilterFunction;
}

export interface CondOpSelectConfig extends FormItem {
  type: 'cond-op';
  parentFields?: string[];
}

export interface DataSourceFieldsConfig extends FormItem {
  type: 'data-source-fields';
}

export interface DataSourceInputConfig extends FormItem {
  type: 'data-source-input';
}

export interface DataSourceMethodsConfig extends FormItem {
  type: 'data-source-methods';
}

export interface DataSourceMethodSelectConfig extends FormItem {
  type: 'data-source-method-select';
  /** 是否可以编辑数据源，disable表示的是是否可以选择数据源 */
  notEditable?: boolean | FilterFunction;
}

export interface DataSourceMocksConfig extends FormItem {
  type: 'data-source-mocks';
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
  /** 是否可以编辑数据源，disable表示的是是否可以选择数据源 */
  notEditable?: boolean | FilterFunction;
}

export interface DisplayCondsConfig extends FormItem {
  titlePrefix?: string;
  parentFields?: string[] | FilterFunction<string[]>;
}

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

export interface KeyValueConfig extends FormItem {
  type: 'key-value';
  advanced?: boolean;
}

export interface PageFragmentSelectConfig extends FormItem {
  type: 'page-fragment-select';
}

export interface UISelectConfig extends FormItem {
  type: 'ui-select';
}

export type EditorChildConfig =
  | DataSourceFieldSelectConfig
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
  | UISelectConfig;
