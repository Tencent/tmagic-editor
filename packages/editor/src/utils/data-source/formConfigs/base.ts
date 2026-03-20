import { defineFormConfig, type FormConfig } from '@tmagic/form';

export default (): FormConfig =>
  defineFormConfig([
    {
      name: 'id',
      type: 'hidden',
    },
    {
      name: 'type',
      text: '类型',
      type: 'hidden',
      defaultValue: 'base',
    },
    {
      name: 'title',
      text: '名称',
      rules: [
        {
          required: true,
          message: '请输入名称',
        },
      ],
    },
    {
      name: 'description',
      text: '描述',
    },
  ]);
