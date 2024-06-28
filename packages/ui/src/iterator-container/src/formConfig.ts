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
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '@tmagic/utils';

export default [
  {
    name: 'iteratorData',
    text: '数据源数据',
    value: 'value',
    dataSourceFieldType: ['array'],
    checkStrictly: true,
    type: 'data-source-field-select',
    onChange: (vm: any, v: string[] = [], { model }: any) => {
      if (Array.isArray(v) && v.length > 1) {
        const [dsId, ...keys] = v;
        model.dsField = [dsId.replace(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX, ''), ...keys];
      } else {
        model.dsField = [];
      }
    },
  },
  {
    name: 'dsField',
    type: 'hidden',
  },
  {
    type: 'panel',
    title: '子项配置',
    name: 'itemConfig',
    items: [
      {
        type: 'display-conds',
        name: 'displayConds',
        titlePrefix: '条件组',
        parentFields: (formState: any, { formValue }: any) => formValue.dsField,
        defaultValue: [],
      },
      {
        name: 'layout',
        text: '容器布局',
        type: 'select',
        defaultValue: 'absolute',
        options: [
          { value: 'absolute', text: '绝对定位' },
          { value: 'relative', text: '流式布局', disabled: true },
        ],
      },
      {
        type: 'fieldset',
        legend: '样式',
        name: 'style',
        items: [
          {
            name: 'width',
            text: '宽度',
          },
          {
            name: 'height',
            text: '高度',
          },
          {
            text: 'overflow',
            name: 'overflow',
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
    ],
  },
];
