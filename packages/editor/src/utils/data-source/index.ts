import { FormConfig } from '@tmagic/form';

import { DatasourceTypeOption } from '@editor/type';

import BaseFormConfig from './formConfigs/base';
import HttpFormConfig from './formConfigs/http';

const fillConfig = (config: FormConfig, datasourceTypeList: DatasourceTypeOption[]): FormConfig => [
  ...BaseFormConfig(datasourceTypeList),
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

export const getFormConfig = (
  type: string,
  datasourceTypeList: DatasourceTypeOption[],
  configs: Record<string, FormConfig>,
): FormConfig => {
  switch (type) {
    case 'base':
      return fillConfig([], datasourceTypeList);
    case 'http':
      return fillConfig(HttpFormConfig, datasourceTypeList);
    default:
      return fillConfig(configs[type] || [], datasourceTypeList);
  }
};
