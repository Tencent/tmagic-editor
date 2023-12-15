import type { FormConfig } from '@tmagic/form';

export default [
  {
    name: 'placeholder',
    text: 'placeholder',
  },
  {
    name: 'append',
    legend: '后置按钮',
    type: 'fieldset',
    labelWidth: '80px',
    items: [
      {
        name: 'text',
        text: '按钮文案',
      },
      {
        name: 'handler',
        type: 'vs-code',
        height: '400px',
        text: '点击',
      },
    ],
  },
] as FormConfig;
