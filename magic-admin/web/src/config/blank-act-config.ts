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

// 新建活动表单配置
// eslint-disable-next-line @typescript-eslint/naming-convention
export const BlankActFormConfig = [
  {
    labelWidth: '120px',
    items: [
      { name: 'actName', text: '活动名称', rules: [{ required: true, message: '请输入活动名称', trigger: 'blur' }] },
      {
        names: ['actBeginTime', 'actEndTime'],
        text: '活动时间',
        type: 'daterange',
        rules: [
          { required: true, message: '请输入活动时间', trigger: 'blur' },
          {
            trigger: 'blur',
            validator: (
              args: { callback: (arg0?: string | undefined) => void },
              data: { model: { c_b_time: string | number | Date; c_e_time: string | number | Date } },
            ) => {
              const start = new Date(data.model.c_b_time);
              const end = new Date(data.model.c_e_time);
              if (start > end) args.callback('结束有效期不能小于开始期');
              else args.callback();
            },
          },
        ],
      },
      {
        name: 'operator',
        text: '创建人',
        rules: [{ required: true }],
        disabled: true,
      },
    ],
  },
];
