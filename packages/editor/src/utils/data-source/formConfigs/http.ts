import { FormConfig } from '@tmagic/form';

export default [
  {
    name: 'autoFetch',
    text: '自动请求',
    type: 'switch',
    defaultValue: true,
  },
  {
    name: 'responseOptions',
    items: [
      {
        name: 'dataPath',
        text: '数据路径',
      },
    ],
  },
  {
    type: 'fieldset',
    name: 'options',
    legend: 'HTTP 配置',
    items: [
      {
        name: 'url',
        text: 'URL',
      },
      {
        name: 'method',
        text: 'Method',
        type: 'select',
        options: [
          { text: 'GET', value: 'GET' },
          { text: 'POST', value: 'POST' },
          { text: 'PUT', value: 'PUT' },
          { text: 'DELETE', value: 'DELETE' },
        ],
      },
      {
        name: 'params',
        type: 'key-value',
        defaultValue: {},
        text: '参数',
      },
      {
        name: 'data',
        type: 'key-value',
        defaultValue: {},
        advanced: true,
        text: '请求体',
      },
      {
        name: 'headers',
        type: 'key-value',
        defaultValue: {},
        text: '请求头',
      },
    ],
  },
] as FormConfig;
