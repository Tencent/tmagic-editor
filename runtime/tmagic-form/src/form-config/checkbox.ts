import { createForm } from '@tmagic/form';

export default createForm([
  {
    name: 'activeValue',
    text: '选中时的值',
    defaultValue: true,
  },
  {
    name: 'inactiveValue',
    text: '没有选中时的值',
    defaultValue: false,
  },
]);
