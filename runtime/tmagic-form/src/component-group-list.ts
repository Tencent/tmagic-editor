import type { ComponentGroup } from '@tmagic/editor';

export const COMPONENT_GROUP_LIST: ComponentGroup[] = [
  {
    title: '容器',
    items: [
      {
        text: '普通容器',
        type: 'container',
        data: {
          items: [],
        },
      },
      {
        text: '表格',
        type: 'table',
        data: {
          items: [],
        },
      },
      {
        text: '组列表',
        type: 'group-list',
        data: {
          items: [],
        },
      },
      {
        text: '面板',
        type: 'panel',
        data: {
          items: [],
        },
      },
      {
        text: '行',
        type: 'row',
        data: {
          items: [],
        },
      },
    ],
  },
  {
    title: '表单组件',
    items: [
      {
        text: '输入框',
        type: 'text',
        data: {
          text: '输入框',
          name: 'text',
        },
      },
      {
        text: '数字输入框',
        type: 'number',
        data: {
          text: '数字输入框',
          name: 'number',
        },
      },
      {
        text: '文本域',
        type: 'textarea',
        data: {
          text: '文本域',
          name: 'textarea',
        },
      },
      {
        text: '链接',
        type: 'link',
        data: {
          text: '链接',
          name: 'link',
        },
      },
      {
        text: '日期',
        type: 'datetime',
        data: {
          text: '日期',
          name: 'datetime',
        },
      },
      {
        text: '时间',
        type: 'time',
        data: {
          text: '时间',
          name: 'time',
        },
      },
      {
        text: '选中器',
        type: 'select',
        data: {
          text: '选中器',
          name: 'select',
        },
      },
      {
        text: '级联选择器',
        type: 'cascader',
        data: {
          text: '级联选择器',
          name: 'cascader',
        },
      },
      {
        text: '开关',
        type: 'switch',
        data: {
          text: '开关',
          name: 'switch',
        },
      },
      {
        text: '多选框',
        type: 'checkbox',
        data: {
          text: '多选框',
          name: 'checkbox',
        },
      },
      {
        text: '多选组',
        type: 'checkboxGroup',
        data: {
          text: '多选组',
          name: 'checkboxGroup',
        },
      },
      {
        text: '单选框',
        type: 'radio',
        data: {
          text: '单选框',
          name: 'radio',
        },
      },
      {
        text: '单选组',
        type: 'radioGroup',
        data: {
          text: '单选组',
          name: 'radioGroup',
        },
      },
      {
        text: '取色器',
        type: 'colorPicker',
        data: {
          text: '取色器',
          name: 'colorPicker',
        },
      },
    ],
  },
];
