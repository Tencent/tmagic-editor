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

import type { Router } from 'vue-router';

import type { ActListItem } from '@src/api/act';
import type { ColumnItem } from '@src/typings';
import { datetimeFormatter } from '@src/util/utils';

// 活动列表表单
export const getActListFormConfig = (
  pageStatusFormatter: ColumnItem['formatter'],
  actStatusFormatter: ColumnItem['formatter'],
  router: Router,
  copyActHandler: ColumnItem['handler'],
  copyActAfterHandler: ColumnItem['handler'],
): ColumnItem[] => [
  {
    prop: '',
    type: 'expand',
    table: [
      {
        prop: 'pageTitle',
        label: '页面标题',
      },
      {
        prop: 'pagePublishTime',
        label: '页面发布时间',
        formatter: datetimeFormatter,
      },
      {
        prop: 'pagePublishStatus',
        label: '页面状态',
        formatter: pageStatusFormatter,
      },
      {
        prop: 'pagePublishOperator',
        label: '发布人',
        formatter: (v: string | number | Date) => (v as string) || '-',
      },
    ],
  },
  {
    prop: 'actId',
    label: '活动ID',
    width: '100',
    sortable: 'custom',
    formatter: (v: string | number | Date) => `<span style="user-select: text;">${v}</span>`,
  },
  {
    prop: 'actName',
    label: '活动名称',
    action: 'actionLink',
    handler: (row: ActListItem) => {
      router.push(`/editor/${row.actId}`);
    },
  },
  {
    prop: 'actBeginTime',
    label: '开始时间',
    formatter: datetimeFormatter,
    sortable: 'custom',
  },
  {
    prop: 'actEndTime',
    label: '结束时间',
    formatter: datetimeFormatter,
    sortable: 'custom',
  },
  {
    prop: 'actStatus',
    label: '活动状态',
    action: 'tag',
    formatter: actStatusFormatter,
  },
  {
    prop: 'operator',
    label: '创建人',
  },
  {
    prop: 'actCryptoId',
    label: '活动ID加密KEY',
    width: '220',
    formatter: (v: string | number | Date) => `<span style="user-select: text;">${v}</span>`,
  },
  {
    prop: '',
    label: '操作',
    actions: [
      {
        text: '查看',
        handler: (row: ActListItem) => {
          router.push(`/editor/${row.actId}`);
        },
      },
      {
        text: '复制',
        type: 'copy',
        handler: copyActHandler,
        after: copyActAfterHandler,
      },
    ],
  },
];
