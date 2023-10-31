import { FormConfig, FormState } from '@tmagic/form';
import { DataSchema, DataSourceSchema } from '@tmagic/schema';

import BaseFormConfig from './formConfigs/base';
import HttpFormConfig from './formConfigs/http';

const fillConfig = (config: FormConfig): FormConfig => [
  ...BaseFormConfig(),
  ...config,
  {
    type: 'tab',
    items: [
      {
        title: '数据定义',
        items: [
          {
            name: 'fields',
            type: 'data-source-fields',
            defaultValue: () => [],
          },
        ],
      },
      {
        title: '方法定义',
        items: [
          {
            name: 'methods',
            type: 'data-source-methods',
            defaultValue: () => [],
          },
        ],
      },
      {
        title: '事件配置',
        display: false,
        items: [
          {
            name: 'events',
            src: 'datasource',
            type: 'event-select',
          },
        ],
      },
      {
        title: 'mock数据',
        items: [
          {
            name: 'mocks',
            type: 'data-source-mocks',
            defaultValue: () => [],
          },
        ],
      },
      {
        title: '请求参数裁剪',
        display: (formState: FormState, { model }: any) => model.type === 'http',
        items: [
          {
            name: 'beforeRequest',
            type: 'vs-code',
            parse: true,
            height: '600px',
          },
        ],
      },
      {
        title: '响应数据裁剪',
        display: (formState: FormState, { model }: any) => model.type === 'http',
        items: [
          {
            name: 'afterResponse',
            type: 'vs-code',
            parse: true,
            height: '600px',
          },
        ],
      },
    ],
  },
];

export const getFormConfig = (type: string, configs: Record<string, FormConfig>): FormConfig => {
  switch (type) {
    case 'base':
      return fillConfig([]);
    case 'http':
      return fillConfig(HttpFormConfig);
    default:
      return fillConfig(configs[type] || []);
  }
};

export const getFormValue = (type: string, values: Partial<DataSourceSchema>): Partial<DataSourceSchema> => {
  if (type !== 'http') {
    return values;
  }

  return {
    beforeRequest: `(options, context) => {
  /**
   * 用户可以直接编写函数，在原始接口调用之前，会运行该函数，将这个函数的返回值作为该数据源接口的入参
   *
   * options: HttpOptions
   *
   * interface HttpOptions {
   *  // 请求链接
   *  url: string;
   *  // query参数
   *  params?: Record<string, string>;
   *  // body数据
   *  data?: Record<string, any>;
   *  // 请求头
   *  headers?: Record<string, string>;
   *  // 请求方法 GET/POST
   *  method?: Method;
   * }
   *
   * context：上下文对象
   *
   * interface Content {
   *  app: AppCore;
   *  dataSource: HttpDataSource;
   * }
   *
   * return: HttpOptions
   */

  // 此处的返回值会作为这个接口的入参
  return options;
}`,
    afterResponse: `(response, context) => {
  /**
   * 用户可以直接编写函数，在原始接口返回之后，会运行该函数，将这个函数的返回值作为该数据源接口的返回

    * context：上下文对象
    *
    * interface Content {
    *  app: AppCore;
    *  dataSource: HttpDataSource;
    * }
    *
    */

  // 此处的返回值会作为这个接口的返回值
  return response;
}`,
    ...values,
  };
};

export const getDisplayField = (dataSources: DataSourceSchema[], key: string) => {
  const displayState: { value: string; type: 'var' | 'text' }[] = [];

  // 匹配es6字符串模块
  const matches = key.matchAll(/\$\{([\s\S]+?)\}/g);
  let index = 0;
  for (const match of matches) {
    if (typeof match.index === 'undefined') break;

    // 字符串常量
    displayState.push({
      type: 'text',
      value: key.substring(index, match.index),
    });

    let dsText = '';
    let ds: DataSourceSchema | undefined;
    let fields: DataSchema[] | undefined;

    // 将模块解析成数据源对应的值
    match[1].split('.').forEach((item, index) => {
      if (index === 0) {
        ds = dataSources.find((ds) => ds.id === item);
        dsText += ds?.title || item;
        fields = ds?.fields;
        return;
      }

      const field = fields?.find((field) => field.name === item);
      fields = field?.fields;
      dsText += `.${field?.title || item}`;
    });

    displayState.push({
      type: 'var',
      value: dsText,
    });

    index = match.index + match[0].length;
  }

  if (index < key.length) {
    displayState.push({
      type: 'text',
      value: key.substring(index),
    });
  }

  return displayState;
};
