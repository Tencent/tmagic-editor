import type { FormConfig } from '@tmagic/form';

export default [
  {
    name: 'id',
    type: 'hidden',
  },
  {
    name: 'type',
    type: 'hidden',
  },
  {
    name: 'name',
    text: '表单key',
    extra: '字段名',
  },
  {
    name: 'text',
    text: '标签文本',
    extra: 'label 标签的文本',
  },
  {
    name: 'labelWidth',
    text: '标签宽度',
    extra: '表单域标签的的宽度，例如 "50px"。支持 auto。',
  },
] as FormConfig;
