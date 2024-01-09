import { createForm } from '@tmagic/form';

export default createForm([
  {
    name: 'placeholder',
    text: 'placeholder',
  },
  {
    name: 'append',
    legend: '后置按钮',
    type: 'fieldset',
    labelWidth: '80px',
    checkbox: true,
    expand: true,
    items: [
      {
        name: 'type',
        type: 'hidden',
        defaultValue: 'button',
      },
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
]);
