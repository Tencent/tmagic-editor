import { createForm } from '@tmagic/form';

export default createForm([
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
]);
