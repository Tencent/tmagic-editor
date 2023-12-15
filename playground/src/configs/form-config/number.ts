import type { FormConfig } from '@tmagic/form';

export default [
  {
    type: 'number',
    name: 'min',
    text: '最小值',
  },
  {
    type: 'number',
    name: 'max',
    text: '最大值',
  },
  {
    type: 'number',
    name: 'step',
    text: '步数',
  },
  {
    name: 'placeholder',
    text: 'placeholder',
  },
] as FormConfig;
