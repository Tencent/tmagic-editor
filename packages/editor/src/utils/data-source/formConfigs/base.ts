import type { FormConfig } from '@tmagic/form';

import type { DatasourceTypeOption } from '@editor/type';

export default function (datasourceTypeList: DatasourceTypeOption[] = []): FormConfig {
  return [
    {
      name: 'id',
      type: 'hidden',
    },
    {
      name: 'type',
      text: '类型',
      type: 'select',
      options: [
        { text: '基础', value: 'base' },
        { text: 'HTTP', value: 'http' },
        ...datasourceTypeList.map((item) => ({ text: item.text, value: item.type })),
      ],
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
  ];
}
