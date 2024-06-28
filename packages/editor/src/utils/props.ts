/* eslint-disable @typescript-eslint/naming-convention */
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

export const arrayOptions = [
  { text: '包含', value: 'include' },
  { text: '不包含', value: 'not_include' },
];

export const eqOptions = [
  { text: '等于', value: '=' },
  { text: '不等于', value: '!=' },
];

export const numberOptions = [
  { text: '大于', value: '>' },
  { text: '大于等于', value: '>=' },
  { text: '小于', value: '<' },
  { text: '小于等于', value: '<=' },
  { text: '在范围内', value: 'between' },
  { text: '不在范围内', value: 'not_between' },
];

export const styleTabConfig: TabPaneConfig = {
  title: '样式',
  items: [
    {
      name: 'style',
      items: [
        {
          type: 'fieldset',
          legend: '位置',
          items: [
            {
              type: 'data-source-field-select',
              name: 'position',
              text: '固定定位',
              checkStrictly: false,
              dataSourceFieldType: ['string'],
              fieldConfig: {
                type: 'checkbox',
                activeValue: 'fixed',
                inactiveValue: 'absolute',
                defaultValue: 'absolute',
              },
            },
            {
              type: 'data-source-field-select',
              name: 'left',
              text: 'left',
              checkStrictly: false,
              dataSourceFieldType: ['string', 'number'],
              fieldConfig: {
                type: 'text',
              },
            },
            {
              type: 'data-source-field-select',
              name: 'top',
              text: 'top',
              checkStrictly: false,
              dataSourceFieldType: ['string', 'number'],
              fieldConfig: {
                type: 'text',
              },
              disabled: (vm: FormState, { model }: any) =>
                model.position === 'fixed' && model._magic_position === 'fixedBottom',
            },
            {
              type: 'data-source-field-select',
              name: 'right',
              text: 'right',
              checkStrictly: false,
              dataSourceFieldType: ['string', 'number'],
              fieldConfig: {
                type: 'text',
              },
            },
            {
              type: 'data-source-field-select',
              name: 'bottom',
              text: 'bottom',
              checkStrictly: false,
              dataSourceFieldType: ['string', 'number'],
              fieldConfig: {
                type: 'text',
              },
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
              type: 'data-source-field-select',
              name: 'width',
              text: '宽度',
              checkStrictly: false,
              dataSourceFieldType: ['string', 'number'],
              fieldConfig: {
                type: 'text',
              },
            },
            {
              type: 'data-source-field-select',
              name: 'height',
              text: '高度',
              checkStrictly: false,
              dataSourceFieldType: ['string', 'number'],
              fieldConfig: {
                type: 'text',
              },
            },
            {
              type: 'data-source-field-select',
              text: 'overflow',
              name: 'overflow',
              checkStrictly: false,
              dataSourceFieldType: ['string'],
              fieldConfig: {
                type: 'select',
                options: [
                  { text: 'visible', value: 'visible' },
                  { text: 'hidden', value: 'hidden' },
                  { text: 'clip', value: 'clip' },
                  { text: 'scroll', value: 'scroll' },
                  { text: 'auto', value: 'auto' },
                  { text: 'overlay', value: 'overlay' },
                ],
              },
            },
          ],
        },
        {
          type: 'fieldset',
          legend: '边框',
          items: [
            {
              type: 'data-source-field-select',
              name: 'borderWidth',
              text: '宽度',
              defaultValue: '0',
              checkStrictly: false,
              dataSourceFieldType: ['string', 'number'],
              fieldConfig: {
                type: 'text',
              },
            },
            {
              type: 'data-source-field-select',
              name: 'borderColor',
              text: '颜色',
              checkStrictly: false,
              dataSourceFieldType: ['string'],
              fieldConfig: {
                type: 'text',
              },
            },
            {
              type: 'data-source-field-select',
              name: 'borderStyle',
              text: '样式',
              defaultValue: 'none',
              checkStrictly: false,
              dataSourceFieldType: ['string'],
              fieldConfig: {
                type: 'select',
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
            },
          ],
        },
        {
          type: 'fieldset',
          legend: '背景',
          items: [
            {
              type: 'data-source-field-select',
              name: 'backgroundImage',
              text: '背景图',
              checkStrictly: false,
              dataSourceFieldType: ['string'],
              fieldConfig: {
                type: 'text',
              },
            },
            {
              type: 'data-source-field-select',
              name: 'backgroundColor',
              text: '背景颜色',
              checkStrictly: false,
              dataSourceFieldType: ['string'],
              fieldConfig: {
                type: 'colorPicker',
              },
            },
            {
              type: 'data-source-field-select',
              name: 'backgroundRepeat',
              text: '背景图重复',
              defaultValue: 'no-repeat',
              checkStrictly: false,
              dataSourceFieldType: ['string'],
              fieldConfig: {
                type: 'select',
                options: [
                  { text: 'repeat', value: 'repeat' },
                  { text: 'repeat-x', value: 'repeat-x' },
                  { text: 'repeat-y', value: 'repeat-y' },
                  { text: 'no-repeat', value: 'no-repeat' },
                  { text: 'inherit', value: 'inherit' },
                ],
              },
            },
            {
              type: 'data-source-field-select',
              name: 'backgroundSize',
              text: '背景图大小',
              defaultValue: '100% 100%',
              checkStrictly: false,
              dataSourceFieldType: ['string'],
              fieldConfig: {
                type: 'text',
              },
            },
          ],
        },
        {
          type: 'fieldset',
          legend: '字体',
          items: [
            {
              type: 'data-source-field-select',
              name: 'color',
              text: '颜色',
              checkStrictly: false,
              dataSourceFieldType: ['string'],
              fieldConfig: {
                type: 'colorPicker',
              },
            },
            {
              type: 'data-source-field-select',
              name: 'fontSize',
              text: '大小',
              checkStrictly: false,
              dataSourceFieldType: ['string', 'number'],
              fieldConfig: {
                type: 'text',
              },
            },
            {
              type: 'data-source-field-select',
              name: 'fontWeight',
              text: '粗细',
              checkStrictly: false,
              dataSourceFieldType: ['string', 'number'],
              fieldConfig: {
                type: 'text',
              },
            },
          ],
        },
        {
          type: 'fieldset',
          legend: '变形',
          name: 'transform',
          items: [
            {
              type: 'data-source-field-select',
              name: 'rotate',
              text: '旋转角度',
              checkStrictly: false,
              dataSourceFieldType: ['string'],
              fieldConfig: {
                type: 'text',
              },
            },
            {
              type: 'data-source-field-select',
              name: 'scale',
              text: '缩放',
              checkStrictly: false,
              dataSourceFieldType: ['number', 'string'],
              fieldConfig: {
                type: 'text',
              },
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
      src: 'component',
      labelWidth: '100px',
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
      type: 'code-select',
    },
    {
      name: 'mounted',
      text: 'mounted',
      type: 'code-select',
    },
  ],
};

export const displayTabConfig: TabPaneConfig = {
  title: '显示条件',
  display: (vm: FormState, { model }: any) => model.type !== 'page',
  items: [
    {
      type: 'display-conds',
      name: 'displayConds',
      titlePrefix: '条件组',
      defaultValue: [],
    },
  ],
};

/**
 * 统一为组件属性表单加上事件、高级、样式配置
 * @param config 组件属性配置
 * @returns Object
 */
export const fillConfig = (config: FormConfig = [], labelWidth = '80px'): FormConfig => [
  {
    type: 'tab',
    labelWidth,
    items: [
      {
        title: '属性',
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
