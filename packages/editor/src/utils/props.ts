/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { FormConfig, FormState, TabPaneConfig } from '@tmagic/form';

import dataSourceService from '@editor/services/dataSource';

const arrayOptions = [
  { text: '包含', value: 'include' },
  { text: '不包含', value: 'not_include' },
];

const eqOptions = [
  { text: '等于', value: '=' },
  { text: '不等于', value: '!=' },
];

const numberOptions = [
  { text: '大于', value: '>' },
  { text: '大于等于', value: '>=' },
  { text: '小于', value: '<' },
  { text: '小于等于', value: '<=' },
  { text: '在范围内', value: 'between' },
  { text: '不在范围内', value: 'not_between' },
];

export const styleTabConfig: TabPaneConfig = {
  title: '样式',
  labelWidth: '80px',
  items: [
    {
      name: 'style',
      items: [
        {
          type: 'fieldset',
          legend: '位置',
          items: [
            {
              name: 'position',
              type: 'checkbox',
              activeValue: 'fixed',
              inactiveValue: 'absolute',
              defaultValue: 'absolute',
              text: '固定定位',
            },
            {
              name: 'left',
              text: 'left',
            },
            {
              name: 'top',
              text: 'top',
              disabled: (vm: FormState, { model }: any) =>
                model.position === 'fixed' && model._magic_position === 'fixedBottom',
            },
            {
              name: 'right',
              text: 'right',
            },
            {
              name: 'bottom',
              text: 'bottom',
              disabled: (vm: FormState, { model }: any) =>
                model.position === 'fixed' && model._magic_position === 'fixedTop',
            },
          ],
        },
        {
          type: 'fieldset',
          legend: '盒子',
          items: [
            {
              name: 'width',
              text: '宽度',
            },
            {
              name: 'height',
              text: '高度',
            },
          ],
        },
        {
          type: 'fieldset',
          legend: '边框',
          items: [
            {
              name: 'borderWidth',
              text: '宽度',
              defaultValue: '0',
            },
            {
              name: 'borderColor',
              text: '颜色',
              type: 'colorPicker',
            },
            {
              name: 'borderStyle',
              text: '样式',
              type: 'select',
              defaultValue: 'none',
              options: [
                { text: 'none', value: 'none' },
                { text: 'hidden', value: 'hidden' },
                { text: 'dotted', value: 'dotted' },
                { text: 'dashed', value: 'dashed' },
                { text: 'solid', value: 'solid' },
                { text: 'double', value: 'double' },
                { text: 'groove', value: 'groove' },
                { text: 'ridge', value: 'ridge' },
                { text: 'inset', value: 'inset' },
                { text: 'outset', value: 'outset' },
              ],
            },
          ],
        },
        {
          type: 'fieldset',
          legend: '背景',
          items: [
            {
              name: 'backgroundImage',
              text: '背景图',
            },
            {
              name: 'backgroundColor',
              text: '背景颜色',
              type: 'colorPicker',
            },
            {
              name: 'backgroundRepeat',
              text: '背景图重复',
              type: 'select',
              defaultValue: 'no-repeat',
              options: [
                { text: 'repeat', value: 'repeat' },
                { text: 'repeat-x', value: 'repeat-x' },
                { text: 'repeat-y', value: 'repeat-y' },
                { text: 'no-repeat', value: 'no-repeat' },
                { text: 'inherit', value: 'inherit' },
              ],
            },
            {
              name: 'backgroundSize',
              text: '背景图大小',
              defaultValue: '100% 100%',
            },
          ],
        },
        {
          type: 'fieldset',
          legend: '字体',
          items: [
            {
              name: 'color',
              text: '颜色',
              type: 'colorPicker',
            },
            {
              name: 'fontSize',
              text: '大小',
            },
            {
              name: 'fontWeight',
              text: '粗细',
            },
          ],
        },
        {
          type: 'fieldset',
          legend: '变形',
          name: 'transform',
          items: [
            {
              name: 'rotate',
              text: '旋转角度',
            },
            {
              name: 'scale',
              text: '缩放',
            },
          ],
        },
      ],
    },
  ],
};

export const eventTabConfig: TabPaneConfig = {
  title: '事件',
  items: [
    {
      name: 'events',
      type: 'event-select',
    },
  ],
};

export const advancedTabConfig: TabPaneConfig = {
  title: '高级',
  lazy: true,
  items: [
    {
      name: 'created',
      text: 'created',
      labelWidth: '100px',
      type: 'code-select',
    },
    {
      name: 'mounted',
      text: 'mounted',
      labelWidth: '100px',
      type: 'code-select',
    },
  ],
};

export const displayTabConfig: TabPaneConfig = {
  title: '显示条件',
  display: (vm: FormState, { model }: any) => model.type !== 'page',
  items: [
    {
      type: 'groupList',
      name: 'displayConds',
      items: [
        {
          type: 'table',
          name: 'cond',
          items: [
            {
              type: 'data-source-field-select',
              name: 'field',
              label: '字段',
            },
            {
              type: 'select',
              options: (mForm: FormState | undefined, { model }: any) => {
                const [id, field] = model.field;

                const ds = dataSourceService.getDataSourceById(id);

                const type = ds?.fields.find((f) => f.name === field)?.type;

                if (type === 'array') {
                  return arrayOptions;
                }

                if (type === 'boolean') {
                  return [
                    { text: '是', value: 'is' },
                    { text: '不是', value: 'not' },
                  ];
                }

                if (type === 'number') {
                  return [...eqOptions, ...numberOptions];
                }

                if (type === 'string') {
                  return [...arrayOptions, ...eqOptions];
                }

                return [...arrayOptions, ...eqOptions, ...numberOptions];
              },
              label: '条件',
              name: 'op',
            },
            {
              label: '值',
              items: [
                {
                  name: 'value',
                  display: (vm: FormState, { model }: any) =>
                    !['between', 'not_between', 'is', 'not'].includes(model.op),
                },
                {
                  name: 'value',
                  type: 'select',
                  options: [
                    { text: 'true', value: true },
                    { text: 'false', value: false },
                  ],
                  display: (vm: FormState, { model }: any) => ['is', 'not'].includes(model.op),
                },
                {
                  name: 'range',
                  type: 'number-range',
                  display: (vm: FormState, { model }: any) =>
                    ['between', 'not_between'].includes(model.op) && !['is', 'not'].includes(model.op),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * 统一为组件属性表单加上事件、高级、样式配置
 * @param config 组件属性配置
 * @returns Object
 */
export const fillConfig = (config: FormConfig = []) => [
  {
    type: 'tab',
    items: [
      {
        title: '属性',
        labelWidth: '80px',
        items: [
          // 组件类型，必须要有
          {
            text: 'type',
            name: 'type',
            type: 'hidden',
          },
          // 组件id，必须要有
          {
            name: 'id',
            type: 'display',
            text: 'id',
          },
          {
            name: 'name',
            text: '组件名称',
          },
          ...config,
        ],
      },
      { ...styleTabConfig },
      { ...eventTabConfig },
      { ...advancedTabConfig },
      { ...displayTabConfig },
    ],
  },
];
