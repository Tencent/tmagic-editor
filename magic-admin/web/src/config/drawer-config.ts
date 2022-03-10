/*
 * Tencent is pleased to support the open source community by making MagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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

import { Ref } from 'vue';

import magicStore from '@src/store/index';
import type { PageInfo } from '@src/typings';

export const drawerFormConfig = (pagesName: Ref<string[]>) => [
  {
    type: 'tab',
    active: '0',
    items: [
      {
        title: '属性',
        labelWidth: '100px',
        items: [
          {
            text: '活动ID',
            name: 'actId',
            type: 'display',
          },
          {
            text: '活动名称',
            name: 'actName',
            type: 'text',
            rules: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
          },
          {
            name: 'type',
            type: 'hidden',
          },
          {
            names: ['actBeginTime', 'actEndTime'],
            text: '活动时间',
            type: 'daterange',
            rules: [{ required: true, message: '请输入活动时间', trigger: 'blur' }, { trigger: 'blur' }],
          },
          {
            name: 'operator',
            text: '责任人',
            type: 'text',
            rules: [{ required: true, message: '请输入责任人', trigger: 'blur' }],
          },
          {
            type: 'fieldset',
            text: 'abTest',
            labelWidth: '100px',
            items: [
              {
                type: 'groupList',
                name: 'abTest',
                defaultValue: [],
                items: [
                  {
                    text: '名称',
                    name: 'name',
                    type: 'text',
                    rules: [
                      { required: true, message: '请输入内容', trigger: 'blur' },
                      {
                        trigger: 'blur',
                        validator: ({ value, callback }: any) => {
                          if (pagesName.value.includes(value)) {
                            callback(new Error('测试页面不能与页面名称重名'));
                          } else {
                            callback();
                          }
                        },
                      },
                    ],
                  },
                  {
                    text: '分桶方式',
                    name: 'type',
                    type: 'select',
                    multiple: true,
                    options: [{ text: 'pgv_pvid', value: 'pgv_pvid' }],
                  },
                  {
                    type: 'table',
                    name: 'pageList',
                    items: [
                      {
                        type: 'select',
                        name: 'pageName',
                        label: '页面',
                        width: 100,
                        align: 'top',
                        options: () =>
                          magicStore.get<PageInfo[]>('pages').map((item: PageInfo) => ({
                            text: item.pageName,
                            value: item.pageName,
                          })),
                      },
                      {
                        name: 'proportion',
                        label: '比例',
                        append: '%',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
