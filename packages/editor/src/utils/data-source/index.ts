import { FormConfig } from '@tmagic/form';
import { DataSchema, DataSourceSchema } from '@tmagic/schema';

import BaseFormConfig from './formConfigs/base';
import HttpFormConfig from './formConfigs/http';

const fillConfig = (config: FormConfig): FormConfig => [
  ...BaseFormConfig(),
  ...config,
  {
    type: 'panel',
    title: '数据定义',
    items: [
      {
        name: 'fields',
        type: 'data-source-fields',
        defaultValue: [],
      },
    ],
  },
  {
    type: 'panel',
    title: '方法定义',
    items: [
      {
        name: 'methods',
        type: 'data-source-methods',
        defaultValue: [],
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
