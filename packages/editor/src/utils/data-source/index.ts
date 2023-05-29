import { FormConfig } from '@tmagic/form';

import BaseFormConfig from './formConfigs/base';
import HttpFormConfig from './formConfigs/http';

const fillConfig = (config: FormConfig): FormConfig => [
  ...BaseFormConfig,
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
